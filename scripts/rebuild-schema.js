require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbUrl =
  process.env.TURSO_DATABASE_URL ||
  `file:${path.join(DATA_DIR, 'soundtracks.db').replace(/\\/g, '/')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url: dbUrl,
  authToken: dbUrl.startsWith('file:') ? undefined : authToken,
});

async function rebuild() {
  console.log('⚠️  Rebuilding SoundtrackDB schema — all existing data will be dropped.\n');
  console.log(`   DB URL: ${dbUrl}\n`);

  // ── 1. Enable FK enforcement ──────────────────────────────────────────────
  await db.execute('PRAGMA foreign_keys = ON;');

  // ── 2. Drop tables in dependency order ───────────────────────────────────
  console.log('🗑️  Dropping existing tables...');
  await db.execute('DROP TABLE IF EXISTS soundtracks;');
  await db.execute('DROP TABLE IF EXISTS title_aliases;');
  await db.execute('DROP TABLE IF EXISTS titles;');
  console.log('   ✓ Dropped soundtracks, title_aliases, titles\n');

  // ── 3. Create `titles` ────────────────────────────────────────────────────
  console.log('📐 Creating tables...');
  await db.execute(`
    CREATE TABLE titles (
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

  await db.execute('CREATE INDEX idx_titles_slug   ON titles (slug);');
  await db.execute('CREATE INDEX idx_titles_tmdb   ON titles (tmdb_id);');
  await db.execute('CREATE INDEX idx_titles_imdb   ON titles (imdb_id);');
  await db.execute('CREATE INDEX idx_titles_lookup ON titles (title, year);');
  console.log('   ✓ titles + indexes');

  // ── 4. Create `title_aliases` ─────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE title_aliases (
      slug        text PRIMARY KEY,
      title_id    text NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
      created_at  numeric DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.execute('CREATE INDEX idx_title_aliases_title ON title_aliases (title_id);');
  console.log('   ✓ title_aliases + indexes');

  // ── 5. Create `soundtracks` ───────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE soundtracks (
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
  await db.execute('CREATE INDEX idx_soundtracks_title  ON soundtracks (title_id);');
  await db.execute('CREATE INDEX idx_soundtracks_active ON soundtracks (is_active);');
  console.log('   ✓ soundtracks + indexes\n');

  console.log('✅  Schema rebuild complete. Run `node scripts/migrate-to-turso.js` to reseed.');
  process.exit(0);
}

rebuild().catch(err => {
  console.error('❌ Schema rebuild failed:', err.message);
  process.exit(1);
});
