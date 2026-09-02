const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Ensure data directory exists for local fallback
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'soundtracks.db').replace(/\\/g, '/')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbUrl.startsWith('file:') ? undefined : authToken,
});

let isInitialized = false;

// ─── Normalization helpers ────────────────────────────────────────────────────

function normalizeImdb(id) {
  if (!id) return null;
  const match = String(id).trim().toLowerCase().match(/tt\d+/);
  return match ? match[0] : String(id).trim().toLowerCase();
}

function normalizeTmdb(id) {
  if (!id) return null;
  return String(id).trim();
}

function normalizeSlug(slug) {
  if (!slug) return null;
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// ─── Confidence table (source × verified → confidence) ───────────────────────
// | source    | verified | confidence |
// | official  | 1        | 1.0        |
// | community | 1        | 0.8        |
// | official  | 0        | 0.6        |
// | community | 0        | 0.4        |
function computeConfidence(source, verified) {
  const s = (source || 'official').toLowerCase();
  const v = verified ? 1 : 0;
  if (s === 'official' && v) return 1.0;
  if (s === 'community' && v) return 0.8;
  if (s === 'official' && !v) return 0.6;
  return 0.4; // community, unverified
}

// ─── DB initialization (idempotent — safe to call on every startup) ───────────

async function initDb() {
  if (isInitialized) return;

  await db.execute('PRAGMA foreign_keys = ON;');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS titles (
      id          text PRIMARY KEY,
      title       text NOT NULL,
      year        integer,
      type        text DEFAULT 'movie' CHECK (type IN ('movie', 'tv')),
      imdb_id     text UNIQUE,
      tmdb_id     text UNIQUE,
      slug        text UNIQUE NOT NULL,
      created_at  numeric DEFAULT CURRENT_TIMESTAMP,
      updated_at  numeric DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_slug   ON titles (slug);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_tmdb   ON titles (tmdb_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_imdb   ON titles (imdb_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_lookup ON titles (title, year);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS title_aliases (
      slug        text PRIMARY KEY,
      title_id    text NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
      created_at  numeric DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_title_aliases_title ON title_aliases (title_id);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS soundtracks (
      id                    text PRIMARY KEY,
      title_id              text NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
      platform              text DEFAULT 'spotify',
      type                  text DEFAULT 'playlist',
      spotify_playlist_id   text NOT NULL,
      spotify_url           text NOT NULL,
      source                text DEFAULT 'official' CHECK (source IN ('official', 'community')),
      verified              integer DEFAULT 1,
      confidence            real DEFAULT 1.0,
      match_type            text DEFAULT 'exact' CHECK (match_type IN ('exact', 'agnostic')),
      is_active             integer DEFAULT 1,
      report_count          integer DEFAULT 0,
      last_checked_at       numeric,
      created_at            numeric DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (title_id, platform, spotify_playlist_id)
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_soundtracks_title  ON soundtracks (title_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_soundtracks_active ON soundtracks (is_active);`);

  isInitialized = true;
}

// Auto-run initialization
initDb().catch(err => console.error('Database initialization error:', err.message));

// ─── Single-row fetchers ──────────────────────────────────────────────────────

async function getTitleById(id) {
  await initDb();
  if (!id) return null;
  const res = await db.execute({
    sql: 'SELECT * FROM titles WHERE id = ? LIMIT 1',
    args: [String(id)],
  });
  return res.rows[0] ? formatTitleRow(res.rows[0]) : null;
}

async function getTitleByImdb(imdbId) {
  await initDb();
  const norm = normalizeImdb(imdbId);
  if (!norm) return null;
  const res = await db.execute({
    sql: 'SELECT * FROM titles WHERE LOWER(imdb_id) = ? LIMIT 1',
    args: [norm],
  });
  return res.rows[0] ? formatTitleRow(res.rows[0]) : null;
}

async function getTitleByTmdb(tmdbId) {
  await initDb();
  const norm = normalizeTmdb(tmdbId);
  if (!norm) return null;
  const res = await db.execute({
    sql: 'SELECT * FROM titles WHERE tmdb_id = ? LIMIT 1',
    args: [norm],
  });
  return res.rows[0] ? formatTitleRow(res.rows[0]) : null;
}

/**
 * Canonical slug-based lookup — routes through title_aliases, NOT titles.slug directly.
 * This is the correct lookup path per spec section 4.
 */
async function getTitleByAlias(slug) {
  await initDb();
  const norm = normalizeSlug(slug);
  if (!norm) return null;
  const res = await db.execute({
    sql: `SELECT t.* FROM titles t
          JOIN title_aliases a ON a.title_id = t.id
          WHERE a.slug = ? LIMIT 1`,
    args: [norm],
  });
  return res.rows[0] ? formatTitleRow(res.rows[0]) : null;
}

/**
 * @deprecated Use getTitleByAlias() instead — kept for internal migration compatibility only.
 */
async function getTitleBySlug(slug) {
  return getTitleByAlias(slug);
}

// ─── Soundtrack fetchers ──────────────────────────────────────────────────────

/**
 * Returns only active soundtracks (is_active = 1) for a title.
 */
async function getSoundtracksForTitle(titleId) {
  await initDb();
  if (!titleId) return [];
  const res = await db.execute({
    sql: `SELECT * FROM soundtracks
          WHERE title_id = ? AND is_active = 1
          ORDER BY confidence DESC, verified DESC, created_at ASC`,
    args: [String(titleId)],
  });
  return res.rows.map(formatSoundtrackRow);
}

async function getAllTitles({ q, year, type, limit = 50, offset = 0 } = {}) {
  await initDb();
  const whereClauses = [];
  const args = [];

  if (year) {
    whereClauses.push('year = ?');
    args.push(parseInt(year, 10));
  }
  if (type) {
    whereClauses.push('LOWER(type) = ?');
    args.push(type.toLowerCase());
  }
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    whereClauses.push('(LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(imdb_id) LIKE ?)');
    args.push(term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM titles ${whereSql}`,
    args,
  });
  const total = Number(countRes.rows[0]?.count || 0);

  const queryArgs = [...args, parseInt(limit, 10), parseInt(offset, 10)];
  const rowsRes = await db.execute({
    sql: `SELECT * FROM titles ${whereSql} ORDER BY year DESC, title ASC LIMIT ? OFFSET ?`,
    args: queryArgs,
  });

  const titles = rowsRes.rows.map(formatTitleRow);
  return { total, offset: parseInt(offset, 10), limit: parseInt(limit, 10), titles };
}

// ─── ID generators ────────────────────────────────────────────────────────────

async function generateNextTitleId() {
  const res = await db.execute('SELECT id FROM titles');
  const numericIds = res.rows
    .map(r => parseInt(String(r.id), 10))
    .filter(n => !isNaN(n));
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return String(max + 1);
}

async function generateNextSoundtrackId() {
  const res = await db.execute('SELECT id FROM soundtracks');
  const numericIds = res.rows
    .map(r => parseInt(String(r.id).replace(/^st-/, ''), 10))
    .filter(n => !isNaN(n));
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return `st-${max + 1}`;
}

// ─── Alias management ─────────────────────────────────────────────────────────

/**
 * Inserts a title_aliases row if it doesn't already exist.
 * Always safe to call — silently no-ops if the alias already exists.
 */
async function ensureAlias(slug, titleId) {
  if (!slug || !titleId) return;
  const norm = normalizeSlug(slug);
  if (!norm) return;
  const tid = String(titleId);

  try {
    const existing = await db.execute({
      sql: 'SELECT title_id FROM title_aliases WHERE slug = ? LIMIT 1',
      args: [norm],
    });

    if (existing.rows.length > 0) {
      const currentTitleId = String(existing.rows[0].title_id);
      if (currentTitleId !== tid) {
        console.warn(
          `[Alias Conflict] Slug "${norm}" already maps to title_id ${currentTitleId}. Ignoring assignment attempt to title_id ${tid}.`
        );
      }
      return;
    }

    await db.execute({
      sql: 'INSERT INTO title_aliases (slug, title_id) VALUES (?, ?)',
      args: [norm, tid],
    });
  } catch (err) {
    console.warn(`[Alias Error] Could not register alias "${norm}" for title ${tid}:`, err.message);
  }
}

/**
 * Increment report_count for a soundtrack.
 * If report_count reaches threshold (5), auto-deactivates the soundtrack (is_active = 0).
 */
async function reportSoundtrack(soundtrackId) {
  await initDb();
  const stId = String(soundtrackId);

  const check = await db.execute({
    sql: 'SELECT id, title_id, report_count, is_active FROM soundtracks WHERE id = ?',
    args: [stId],
  });

  if (check.rows.length === 0) return null;

  const currentCount = Number(check.rows[0].report_count || 0);
  const newCount = currentCount + 1;
  const shouldDeactivate = newCount >= 5;

  await db.execute({
    sql: `UPDATE soundtracks
          SET report_count = ?,
              is_active = CASE WHEN ? >= 5 THEN 0 ELSE is_active END
          WHERE id = ?`,
    args: [newCount, newCount, stId],
  });

  return {
    id: stId,
    title_id: String(check.rows[0].title_id),
    report_count: newCount,
    is_active: shouldDeactivate ? false : Boolean(Number(check.rows[0].is_active)),
    deactivated: shouldDeactivate,
  };
}


// ─── Core dedupe function (spec section 3) ────────────────────────────────────

/**
 * The required 4-step title resolution & creation function.
 * Prevents duplicate title rows by checking tmdb_id → imdb_id → title+year
 * before ever doing an INSERT.
 *
 * Returns { title, isNew, matchType } where matchType is 'exact' or 'agnostic'.
 */
async function resolveOrCreateTitle(input) {
  await initDb();

  const {
    tmdb_id: rawTmdb,
    imdb_id: rawImdb,
    title: rawTitle,
    year: rawYear,
    type: rawType,
    slug: rawSlug,
    id: hintId,
  } = input;

  const tmdb_id = normalizeTmdb(rawTmdb);
  const imdb_id = normalizeImdb(rawImdb);
  const year    = rawYear ? parseInt(rawYear, 10) : null;
  const type    = rawType || 'movie';
  const slug    = normalizeSlug(rawSlug) || normalizeSlug(`${rawTitle || ''}-${year || new Date().getFullYear()}`);

  // Step 1: tmdb_id lookup
  if (tmdb_id) {
    const existing = await getTitleByTmdb(tmdb_id);
    if (existing) {
      await ensureAlias(slug, existing.id);
      return { title: existing, isNew: false, matchType: 'exact' };
    }
  }

  // Step 2: imdb_id lookup
  if (imdb_id) {
    const existing = await getTitleByImdb(imdb_id);
    if (existing) {
      await ensureAlias(slug, existing.id);
      return { title: existing, isNew: false, matchType: 'exact' };
    }
  }

  // Step 3: normalized title + year lookup (agnostic)
  // Strips ALL non-alphanumeric chars so "Mr.Kill" == "mr kill" == "mr-kill" == "mrkill"
  if (rawTitle && year) {
    const normalized = String(rawTitle).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const res = await db.execute({
      sql: `SELECT * FROM titles
            WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,'.',''),'-',''),' ',''),',',''),'''','')) = ? AND year = ?
            LIMIT 1`,
      args: [normalized, year],
    });
    if (res.rows[0]) {
      const existing = formatTitleRow(res.rows[0]);
      await ensureAlias(slug, existing.id);
      return { title: existing, isNew: false, matchType: 'agnostic' };
    }
  }


  // Step 4: Nothing found — insert a new canonical titles row
  const id = hintId ? String(hintId) : await generateNextTitleId();
  const canonicalSlug = slug || normalizeSlug(`${rawTitle || 'unknown'}-${year || new Date().getFullYear()}`);

  await db.execute({
    sql: `INSERT INTO titles (id, title, year, type, imdb_id, tmdb_id, slug)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, rawTitle || '', year, type, imdb_id || null, tmdb_id || null, canonicalSlug],
  });

  // Backfill canonical slug into title_aliases
  await ensureAlias(canonicalSlug, id);

  await syncJsonBackups();
  const created = await getTitleById(id);
  return { title: created, isNew: true, matchType: 'exact' };
}

/**
 * Legacy alias kept for backward compatibility with scripts that call insertOrUpdateTitle.
 * Internally delegates to resolveOrCreateTitle.
 */
async function insertOrUpdateTitle(data) {
  const result = await resolveOrCreateTitle(data);

  // If title already existed, patch any newly-provided fields (tmdb_id, imdb_id, etc.)
  if (!result.isNew) {
    const existing = result.title;
    const updatedImdb = data.imdb_id ? normalizeImdb(data.imdb_id) : (existing.imdb_id || null);
    const updatedTmdb = data.tmdb_id ? normalizeTmdb(data.tmdb_id) : (existing.tmdb_id || null);
    const updatedTitle = data.title || existing.title;
    const updatedYear = data.year ? parseInt(data.year, 10) : existing.year;
    const updatedType = data.type || existing.type;
    const updatedSlug = data.slug ? normalizeSlug(data.slug) : (existing.slug || null);

    await db.execute({
      sql: `UPDATE titles SET title = ?, year = ?, type = ?, imdb_id = ?, tmdb_id = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [updatedTitle, updatedYear, updatedType, updatedImdb || null, updatedTmdb || null, updatedSlug || null, existing.id],
    });

    await syncJsonBackups();
    const refreshed = await getTitleById(existing.id);
    return { title: refreshed, isNew: false };
  }

  return { title: result.title, isNew: result.isNew };
}

// ─── Soundtrack insert / remove / override ───────────────────────────────────

async function insertSoundtrack(data) {
  await initDb();
  const titleId  = String(data.title_id);
  const playlistId = data.spotify_playlist_id;
  const platform = data.platform || 'spotify';

  // Check if mapping already exists (UNIQUE constraint covers this but we want the row back)
  const existingRes = await db.execute({
    sql: 'SELECT * FROM soundtracks WHERE title_id = ? AND platform = ? AND spotify_playlist_id = ? LIMIT 1',
    args: [titleId, platform, playlistId],
  });

  if (existingRes.rows.length > 0) {
    return { soundtrack: formatSoundtrackRow(existingRes.rows[0]), isNew: false };
  }

  const id         = data.id ? String(data.id) : await generateNextSoundtrackId();
  const type       = data.type || 'playlist';
  const source     = data.source || 'official';
  const verified   = data.verified !== undefined ? (data.verified ? 1 : 0) : 1;
  const matchType  = data.match_type || 'exact';
  const confidence = data.confidence !== undefined ? data.confidence : computeConfidence(source, verified);
  const spotify_url = data.spotify_url || (type === 'album'
    ? `https://open.spotify.com/album/${playlistId}`
    : `https://open.spotify.com/playlist/${playlistId}`);

  // Warn if official+unverified (per spec: flag for manual review)
  if (source === 'official' && !verified) {
    console.warn(`insertSoundtrack: official but unverified soundtrack for title_id=${titleId} — flagged for manual review.`);
  }

  await db.execute({
    sql: `INSERT INTO soundtracks
            (id, title_id, platform, type, spotify_playlist_id, spotify_url,
             source, verified, confidence, match_type, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    args: [id, titleId, platform, type, playlistId, spotify_url, source, verified, confidence, matchType],
  });

  await syncJsonBackups();
  const createdRes = await db.execute({
    sql: 'SELECT * FROM soundtracks WHERE id = ? LIMIT 1',
    args: [id],
  });

  return { soundtrack: formatSoundtrackRow(createdRes.rows[0]), isNew: true };
}

async function removeSoundtracksByTitleId(titleId, soundtrackId = null) {
  await initDb();
  const tid = String(titleId);
  let rowsAffected = 0;

  if (soundtrackId) {
    const res = await db.execute({
      sql: 'DELETE FROM soundtracks WHERE title_id = ? AND id = ?',
      args: [tid, String(soundtrackId)],
    });
    rowsAffected = res.rowsAffected || 0;
  } else {
    const res = await db.execute({
      sql: 'DELETE FROM soundtracks WHERE title_id = ?',
      args: [tid],
    });
    rowsAffected = res.rowsAffected || 0;
  }

  if (rowsAffected > 0) {
    await syncJsonBackups();
  }
  return rowsAffected;
}

async function overrideSoundtrackForTitle(titleId, newSoundtrackData) {
  await removeSoundtracksByTitleId(titleId);
  return insertSoundtrack({
    title_id: titleId,
    ...newSoundtrackData,
    verified: true,
  });
}

// ─── JSON backup ──────────────────────────────────────────────────────────────

async function syncJsonBackups() {
  try {
    const allTitlesRes = await db.execute('SELECT * FROM titles ORDER BY CAST(id AS INTEGER) ASC');
    const allSoundtracksRes = await db.execute("SELECT * FROM soundtracks ORDER BY CAST(REPLACE(id, 'st-', '') AS INTEGER) ASC");

    const titlesList = allTitlesRes.rows.map(formatTitleRow);
    const soundtracksList = allSoundtracksRes.rows.map(formatSoundtrackRow);

    const titlesPath = path.join(DATA_DIR, 'titles.json');
    const soundtracksPath = path.join(DATA_DIR, 'soundtracks.json');

    fs.writeFileSync(titlesPath, JSON.stringify(titlesList, null, 2), 'utf8');
    fs.writeFileSync(soundtracksPath, JSON.stringify(soundtracksList, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal backup warning
    console.warn('JSON backup sync skipped:', err.message);
  }
}

// ─── Row formatters ───────────────────────────────────────────────────────────

function formatTitleRow(row) {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    year: row.year ? Number(row.year) : null,
    type: String(row.type || 'movie'),
    imdb_id: row.imdb_id ? String(row.imdb_id) : '',
    tmdb_id: row.tmdb_id ? String(row.tmdb_id) : '',
    slug: row.slug ? String(row.slug) : '',
  };
}

function formatSoundtrackRow(row) {
  const verified = row.verified !== undefined ? Boolean(Number(row.verified)) : true;
  const source   = String(row.source || 'official');
  return {
    id: String(row.id),
    title_id: String(row.title_id),
    platform: String(row.platform || 'spotify'),
    type: String(row.type || 'playlist'),
    spotify_playlist_id: String(row.spotify_playlist_id),
    spotify_url: String(row.spotify_url),
    source,
    verified,
    confidence: row.confidence !== undefined && row.confidence !== null ? Number(row.confidence) : computeConfidence(source, verified),
    match_type: String(row.match_type || 'exact'),
    is_active: row.is_active !== undefined ? Boolean(Number(row.is_active)) : true,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  db,
  initDb,
  // Title fetchers
  getTitleById,
  getTitleByImdb,
  getTitleByTmdb,
  getTitleByAlias,
  getTitleBySlug, // deprecated alias → getTitleByAlias
  // Soundtrack fetchers
  getSoundtracksForTitle,
  getAllTitles,
  // Core dedupe
  resolveOrCreateTitle,
  insertOrUpdateTitle, // legacy wrapper → resolveOrCreateTitle
  // Alias management
  ensureAlias,
  // Soundtrack ops
  insertSoundtrack,
  removeSoundtracksByTitleId,
  overrideSoundtrackForTitle,
  reportSoundtrack,
};


