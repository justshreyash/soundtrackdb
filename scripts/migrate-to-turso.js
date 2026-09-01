require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { initDb, insertOrUpdateTitle, insertSoundtrack, getAllTitles } = require('../src/services/soundtrack-db');

const TITLES_FILE = path.join(__dirname, '../data/titles.json');
const SOUNDTRACKS_FILE = path.join(__dirname, '../data/soundtracks.json');

async function migrate() {
  console.log('🚀 Starting Migration from JSON to Turso (libSQL)...');
  await initDb();

  let titles = [];
  let soundtracks = [];

  if (fs.existsSync(TITLES_FILE)) {
    try {
      titles = JSON.parse(fs.readFileSync(TITLES_FILE, 'utf8'));
    } catch {}
  }

  if (fs.existsSync(SOUNDTRACKS_FILE)) {
    try {
      soundtracks = JSON.parse(fs.readFileSync(SOUNDTRACKS_FILE, 'utf8'));
    } catch {}
  }

  console.log(`📥 Loaded ${titles.length} titles and ${soundtracks.length} soundtracks from JSON files.`);

  let importedTitles = 0;
  for (const t of titles) {
    try {
      await insertOrUpdateTitle({
        id: t.id,
        title: t.title,
        year: t.year,
        type: t.type || 'movie',
        imdb_id: t.imdb_id,
        tmdb_id: t.tmdb_id,
        slug: t.slug,
      });
      importedTitles++;
    } catch (err) {
      console.warn(`Error importing title "${t.title}":`, err.message);
    }
  }

  let importedSoundtracks = 0;
  for (const s of soundtracks) {
    try {
      await insertSoundtrack({
        id: s.id,
        title_id: s.title_id,
        platform: s.platform || 'spotify',
        type: s.type || 'playlist',
        spotify_playlist_id: s.spotify_playlist_id,
        spotify_url: s.spotify_url,
        source: s.source || 'official',
        verified: s.verified !== undefined ? s.verified : true,
      });
      importedSoundtracks++;
    } catch (err) {
      console.warn(`Error importing soundtrack ${s.id}:`, err.message);
    }
  }

  console.log(`\n✅ Migration Complete!`);
  console.log(`   Titles imported: ${importedTitles}`);
  console.log(`   Soundtracks imported: ${importedSoundtracks}`);

  const check = await getAllTitles({ limit: 5 });
  console.log(`\n📊 Verification: Database currently contains ${check.total} total titles.`);
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };
