require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { resolveByTmdb } = require('../src/services/soundtrack-resolver');

// Example list of 2025/2026 popular movie TMDB IDs
const TMDB_IDS = [
  '766507',  // The Electric State
  '993710',  // Back in Action
  '1005331', // Carry-On
  '974950',  // Emilia Pérez
  '646097',  // Rebel Ridge
  '974635',  // Hit Man
  '848685',  // The Union
  '519182',  // Beverly Hills Cop: Axel F
  '823464',  // Atlas
  '763215',  // Damsel
  '636706',  // Spaceman
  '1139829', // Scoop
  '744275',  // Uglies
  '1096196', // The Piano Lesson
  '592983',  // Spellbound
  '1182368', // Joy
  '1105407', // Don't Move
  '938614',  // The Deliverance
  '963746',  // Lonely Planet
  '1084199', // Apex
  '801335',  // Havoc
  '827014',  // Wake Up Dead Man
  '1094556', // Frankenstein
  '1298238', // Rip
  '1357633', // A Nonsense Christmas
];

async function main() {
  const args = process.argv.slice(2);
  const idsToProcess = args.length > 0 ? args : TMDB_IDS;

  console.log(`\n🎬 Starting Dynamic TMDB Ingestion for ${idsToProcess.length} title(s)...\n`);

  let count = 0;
  for (const id of idsToProcess) {
    try {
      console.log(`[${++count}/${idsToProcess.length}] Processing TMDB ID: ${id}...`);
      const result = await resolveByTmdb(id);

      if (result && result.title) {
        const musicCount = result.soundtracks?.length || 0;
        const playlist = result.soundtracks?.[0]?.spotify_url || 'No playlist found';
        console.log(`   ✅ "${result.title.title}" (${result.title.year})`);
        console.log(`      Slug: ${result.title.slug} | IMDb: ${result.title.imdb_id || 'N/A'}`);
        console.log(`      Soundtracks: ${musicCount} (${playlist})\n`);
      } else {
        console.log(`   ⚠️ Could not resolve metadata for TMDB ID: ${id}\n`);
      }
    } catch (err) {
      console.error(`   ❌ Error on TMDB ID ${id}:`, err.message, '\n');
    }
  }

  console.log('✨ Dynamic ingestion complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, TMDB_IDS };
