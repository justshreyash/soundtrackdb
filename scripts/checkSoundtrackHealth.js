/**
 * SoundtrackDB — Playlist Health-Check Script
 *
 * For each active soundtrack row, calls the Spotify API to verify the playlist/album
 * still exists and isn't private. Marks dead playlists as is_active = 0.
 *
 * Usage:  node scripts/checkSoundtrackHealth.js
 * Flags:  --dry-run   Print what would change without writing to DB
 *
 * TODO (prod scheduling): Hook this up as a Vercel Cron job or GitHub Actions workflow
 * triggered nightly — not needed until real traffic warrants it.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { db, initDb } = require('../src/services/soundtrack-db');
const { getToken } = require('../src/token-manager');

const DRY_RUN = process.argv.includes('--dry-run');

async function checkSoundtrackHealth() {
  await initDb();
  console.log(`🩺 SoundtrackDB Health Check${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Fetch all active soundtracks
  const res = await db.execute(
    `SELECT id, title_id, spotify_playlist_id, type, platform FROM soundtracks WHERE is_active = 1`
  );
  const rows = res.rows;
  console.log(`   Found ${rows.length} active soundtrack(s) to check.\n`);

  if (rows.length === 0) {
    console.log('✅  Nothing to check.');
    process.exit(0);
  }

  // Obtain a Spotify access token (uses existing token-manager)
  let spotifyToken;
  try {
    spotifyToken = await getToken();
    if (!spotifyToken) throw new Error('Token was null');
  } catch (err) {
    console.error('❌  Could not obtain Spotify token:', err.message);
    process.exit(1);
  }

  let checked = 0;
  let markedDead = 0;
  let markedAlive = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const row of rows) {
    const { id, title_id, spotify_playlist_id, type } = row;
    const endpoint = type === 'album'
      ? `https://api.spotify.com/v1/albums/${spotify_playlist_id}`
      : `https://api.spotify.com/v1/playlists/${spotify_playlist_id}?fields=id,name,public`;

    let isAlive = false;
    let reason = '';

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });

      if (response.status === 200) {
        const data = await response.json();
        // Playlists: must be public (public !== false)
        if (type === 'playlist' && data.public === false) {
          isAlive = false;
          reason = 'playlist is private';
        } else {
          isAlive = true;
        }
      } else if (response.status === 404) {
        isAlive = false;
        reason = '404 not found';
      } else {
        // 401/403/429 etc — don't flip is_active, just skip
        console.warn(`   ⚠️  Skipping ${id} (title_id=${title_id}): HTTP ${response.status}`);
        checked++;
        continue;
      }
    } catch (err) {
      console.warn(`   ⚠️  Network error checking ${id}:`, err.message);
      checked++;
      continue;
    }

    if (isAlive) {
      if (!DRY_RUN) {
        await db.execute({
          sql: `UPDATE soundtracks SET last_checked_at = ? WHERE id = ?`,
          args: [now, id],
        });
      }
      console.log(`   ✅  ${id} (playlist: ${spotify_playlist_id}) — alive`);
      markedAlive++;
    } else {
      if (!DRY_RUN) {
        await db.execute({
          sql: `UPDATE soundtracks SET is_active = 0, last_checked_at = ? WHERE id = ?`,
          args: [now, id],
        });
      }
      console.log(`   ❌  ${id} (playlist: ${spotify_playlist_id}) — DEAD [${reason}]${DRY_RUN ? ' (dry-run, not written)' : ''}`);
      markedDead++;
    }

    checked++;
  }

  console.log(`\n📊  Results: ${checked} checked — ${markedAlive} alive, ${markedDead} marked dead.`);
  if (DRY_RUN) console.log('   (Dry-run mode: no DB writes performed)');
  process.exit(0);
}

checkSoundtrackHealth().catch(err => {
  console.error('❌  Health check failed:', err.message);
  process.exit(1);
});
