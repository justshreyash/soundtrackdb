/**
 * Reseed script — loads data/titles.json + data/soundtracks.json into Turso.
 *
 * Every title insert goes through resolveOrCreateTitle() (4-step dedupe) so:
 *  - No duplicate title rows are created
 *  - title_aliases is properly backfilled for every slug
 *  - soundtracks get correct confidence + match_type values
 *
 * Run AFTER `node scripts/rebuild-schema.js`.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const {
  initDb,
  resolveOrCreateTitle,
  ensureAlias,
  insertSoundtrack,
  getAllTitles,
} = require('../src/services/soundtrack-db');

const TITLES_FILE      = path.join(__dirname, '../data/titles.json');
const SOUNDTRACKS_FILE = path.join(__dirname, '../data/soundtracks.json');

async function migrate() {
  console.log('🚀 Starting Reseed — JSON → Turso (libSQL)...\n');
  await initDb();

  let titles = [];
  let soundtracks = [];

  if (fs.existsSync(TITLES_FILE)) {
    try { titles = JSON.parse(fs.readFileSync(TITLES_FILE, 'utf8')); } catch {}
  }
  if (fs.existsSync(SOUNDTRACKS_FILE)) {
    try { soundtracks = JSON.parse(fs.readFileSync(SOUNDTRACKS_FILE, 'utf8')); } catch {}
  }

  console.log(`📥  Loaded ${titles.length} title(s) and ${soundtracks.length} soundtrack(s) from JSON.\n`);

  // ── 1. Import titles through dedupe pipeline ───────────────────────────────
  let importedTitles = 0;
  let deduped = 0;
  const titleIdMap = {}; // old JSON id → canonical DB id (may differ after dedupe)

  for (const t of titles) {
    try {
      const result = await resolveOrCreateTitle({
        id: t.id,
        title: t.title,
        year: t.year,
        type: t.type || 'movie',
        imdb_id: t.imdb_id || null,
        tmdb_id: t.tmdb_id || null,
        slug: t.slug,
      });

      // Map original JSON id to the canonical id (may differ if a duplicate was found)
      titleIdMap[String(t.id)] = result.title.id;

      // Also ensure the slug from the JSON file is registered as an alias
      if (t.slug) {
        await ensureAlias(t.slug, result.title.id);
      }

      if (result.isNew) {
        importedTitles++;
      } else {
        deduped++;
        console.log(`   ↩  Deduped: "${t.title}" (${t.id}) → canonical id=${result.title.id}`);
      }
    } catch (err) {
      console.warn(`   ⚠  Error importing title "${t.title}":`, err.message);
    }
  }

  console.log(`\n✅  Titles: ${importedTitles} inserted, ${deduped} deduplicated.\n`);

  // ── 2. Import soundtracks ─────────────────────────────────────────────────
  let importedSoundtracks = 0;
  let skippedSoundtracks = 0;

  for (const s of soundtracks) {
    try {
      // Remap title_id through the dedupe map
      const canonicalTitleId = titleIdMap[String(s.title_id)] || String(s.title_id);

      const verified = s.verified !== undefined ? Boolean(s.verified) : true;
      const source   = s.source || 'official';

      const result = await insertSoundtrack({
        id: s.id,
        title_id: canonicalTitleId,
        platform: s.platform || 'spotify',
        type: s.type || 'playlist',
        spotify_playlist_id: s.spotify_playlist_id,
        spotify_url: s.spotify_url,
        source,
        verified,
        match_type: s.match_type || 'exact',
        // confidence computed from source+verified in insertSoundtrack if not explicitly set
        confidence: s.confidence !== undefined ? s.confidence : undefined,
      });

      if (result.isNew) {
        importedSoundtracks++;
      } else {
        skippedSoundtracks++;
      }
    } catch (err) {
      console.warn(`   ⚠  Error importing soundtrack ${s.id}:`, err.message);
    }
  }

  console.log(`✅  Soundtracks: ${importedSoundtracks} inserted, ${skippedSoundtracks} already existed.\n`);

  // ── 3. Verification ──────────────────────────────────────────────────────
  const check = await getAllTitles({ limit: 5 });
  console.log(`📊  Verification: DB now contains ${check.total} total title(s).`);
  console.log('\n🎉  Reseed complete!');
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  });
}

module.exports = { migrate };
