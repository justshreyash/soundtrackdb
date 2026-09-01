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

/**
 * Initialize Turso tables and indexes.
 */
async function initDb() {
  if (isInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS titles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year INTEGER,
      type TEXT DEFAULT 'movie',
      imdb_id TEXT UNIQUE,
      tmdb_id TEXT UNIQUE,
      slug TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_imdb ON titles(imdb_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_tmdb ON titles(tmdb_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_titles_slug ON titles(slug);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS soundtracks (
      id TEXT PRIMARY KEY,
      title_id TEXT NOT NULL,
      platform TEXT DEFAULT 'spotify',
      type TEXT DEFAULT 'playlist',
      spotify_playlist_id TEXT NOT NULL,
      spotify_url TEXT NOT NULL,
      source TEXT DEFAULT 'official',
      verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(title_id, spotify_playlist_id)
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_soundtracks_title ON soundtracks(title_id);`);

  isInitialized = true;
}

// Auto-run initialization
initDb().catch(err => console.error('Database initialization error:', err.message));

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

async function getTitleBySlug(slug) {
  await initDb();
  const norm = normalizeSlug(slug);
  if (!norm) return null;
  const res = await db.execute({
    sql: 'SELECT * FROM titles WHERE LOWER(slug) = ? LIMIT 1',
    args: [norm],
  });
  return res.rows[0] ? formatTitleRow(res.rows[0]) : null;
}

async function getSoundtracksForTitle(titleId) {
  await initDb();
  if (!titleId) return [];
  const res = await db.execute({
    sql: 'SELECT * FROM soundtracks WHERE title_id = ? ORDER BY verified DESC, created_at ASC',
    args: [String(titleId)],
  });
  return res.rows.map(formatSoundtrackRow);
}

async function getAllTitles({ q, year, type, limit = 50, offset = 0 } = {}) {
  await initDb();
  let whereClauses = [];
  let args = [];

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

  // Get total count
  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM titles ${whereSql}`,
    args,
  });
  const total = Number(countRes.rows[0]?.count || 0);

  // Get paginated rows
  const queryArgs = [...args, parseInt(limit, 10), parseInt(offset, 10)];
  const rowsRes = await db.execute({
    sql: `SELECT * FROM titles ${whereSql} ORDER BY year DESC, title ASC LIMIT ? OFFSET ?`,
    args: queryArgs,
  });

  const titles = rowsRes.rows.map(formatTitleRow);
  return { total, offset: parseInt(offset, 10), limit: parseInt(limit, 10), titles };
}

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

async function insertOrUpdateTitle(data) {
  await initDb();

  let existing = null;
  if (data.imdb_id) existing = await getTitleByImdb(data.imdb_id);
  if (!existing && data.tmdb_id) existing = await getTitleByTmdb(data.tmdb_id);
  if (!existing && data.slug) existing = await getTitleBySlug(data.slug);
  if (!existing && data.id) existing = await getTitleById(data.id);

  if (existing) {
    const updatedTitle = data.title || existing.title;
    const updatedYear = data.year ? parseInt(data.year, 10) : existing.year;
    const updatedType = data.type || existing.type;
    const updatedImdb = data.imdb_id ? normalizeImdb(data.imdb_id) : (existing.imdb_id || null);
    const updatedTmdb = data.tmdb_id ? normalizeTmdb(data.tmdb_id) : (existing.tmdb_id || null);
    const updatedSlug = data.slug ? normalizeSlug(data.slug) : (existing.slug || null);

    await db.execute({
      sql: `UPDATE titles SET title = ?, year = ?, type = ?, imdb_id = ?, tmdb_id = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [updatedTitle, updatedYear, updatedType, updatedImdb || null, updatedTmdb || null, updatedSlug || null, existing.id],
    });

    await syncJsonBackups();
    const refreshed = await getTitleById(existing.id);
    return { title: refreshed, isNew: false };
  }

  const id = data.id ? String(data.id) : await generateNextTitleId();
  const title = data.title || '';
  const year = parseInt(data.year, 10) || new Date().getFullYear();
  const type = data.type || 'movie';
  const imdb_id = normalizeImdb(data.imdb_id) || null;
  const tmdb_id = normalizeTmdb(data.tmdb_id) || null;
  const slug = normalizeSlug(data.slug) || normalizeSlug(`${title}-${year}`);

  await db.execute({
    sql: `INSERT INTO titles (id, title, year, type, imdb_id, tmdb_id, slug) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, year, type, imdb_id, tmdb_id, slug],
  });

  await syncJsonBackups();
  const created = await getTitleById(id);
  return { title: created, isNew: true };
}

async function insertSoundtrack(data) {
  await initDb();
  const titleId = String(data.title_id);
  const playlistId = data.spotify_playlist_id;

  // Check if mapping already exists
  const existingRes = await db.execute({
    sql: 'SELECT * FROM soundtracks WHERE title_id = ? AND spotify_playlist_id = ? LIMIT 1',
    args: [titleId, playlistId],
  });

  if (existingRes.rows.length > 0) {
    return { soundtrack: formatSoundtrackRow(existingRes.rows[0]), isNew: false };
  }

  const id = data.id ? String(data.id) : await generateNextSoundtrackId();
  const platform = data.platform || 'spotify';
  const type = data.type || 'playlist';
  const spotify_url = data.spotify_url || (type === 'album' ? `https://open.spotify.com/album/${playlistId}` : `https://open.spotify.com/playlist/${playlistId}`);
  const source = data.source || 'official';
  const verified = data.verified !== undefined ? (data.verified ? 1 : 0) : 1;

  await db.execute({
    sql: `INSERT INTO soundtracks (id, title_id, platform, type, spotify_playlist_id, spotify_url, source, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, titleId, platform, type, playlistId, spotify_url, source, verified],
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
  return {
    id: String(row.id),
    title_id: String(row.title_id),
    platform: String(row.platform || 'spotify'),
    type: String(row.type || 'playlist'),
    spotify_playlist_id: String(row.spotify_playlist_id),
    spotify_url: String(row.spotify_url),
    source: String(row.source || 'official'),
    verified: Boolean(row.verified),
  };
}

module.exports = {
  db,
  initDb,
  syncJsonBackups,
  getTitleById,
  getTitleByImdb,
  getTitleByTmdb,
  getTitleBySlug,
  getSoundtracksForTitle,
  getAllTitles,
  insertOrUpdateTitle,
  insertSoundtrack,
  removeSoundtracksByTitleId,
  overrideSoundtrackForTitle,
  normalizeImdb,
  normalizeTmdb,
  normalizeSlug,
};
