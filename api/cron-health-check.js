/**
 * Vercel Cron Function — SoundtrackDB Playlist Health Check
 *
 * Scheduled via vercel.json to run weekly (Sunday 02:00 UTC).
 * Can also be triggered manually: GET /api/cron-health-check
 * with header: Authorization: Bearer <CRON_SECRET>
 *
 * Returns a JSON summary of checked/alive/dead playlists.
 */

require('../src/services/soundtrack-db'); // ensure dotenv is loaded via the service
const { db, initDb } = require('../src/services/soundtrack-db');
const { getToken } = require('../src/token-manager');

const CRON_SECRET = process.env.CRON_SECRET;

module.exports = async function handler(req, res) {
  // ── Auth: require CRON_SECRET on non-Vercel-internal calls ───────────────────
  if (CRON_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (provided !== CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  const startedAt = new Date().toISOString();
  const results = { checked: 0, alive: 0, dead: 0, skipped: 0, details: [] };

  try {
    await initDb();

    const rows = (await db.execute(
      'SELECT id, title_id, spotify_playlist_id, type FROM soundtracks WHERE is_active = 1'
    )).rows;

    results.total_active = rows.length;

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active soundtracks to check.',
        started_at: startedAt,
        ...results,
      });
    }

    let spotifyToken;
    try {
      spotifyToken = await getToken();
      if (!spotifyToken) throw new Error('null token');
    } catch (err) {
      return res.status(503).json({
        success: false,
        error: 'Could not obtain Spotify token: ' + err.message,
      });
    }

    const now = Math.floor(Date.now() / 1000);

    for (const row of rows) {
      const { id, title_id, spotify_playlist_id, type } = row;
      const endpoint = type === 'album'
        ? `https://api.spotify.com/v1/albums/${spotify_playlist_id}`
        : `https://api.spotify.com/v1/playlists/${spotify_playlist_id}?fields=id,public`;

      try {
        const spotifyRes = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });

        let isAlive = false;
        let reason = '';

        if (spotifyRes.status === 200) {
          const data = await spotifyRes.json();
          if (type === 'playlist' && data.public === false) {
            reason = 'private playlist';
          } else {
            isAlive = true;
          }
        } else if (spotifyRes.status === 404) {
          reason = '404 not found';
        } else {
          // 401/429 etc — skip, don't flip is_active
          results.skipped++;
          results.details.push({ id, status: 'skipped', http: spotifyRes.status });
          continue;
        }

        if (isAlive) {
          await db.execute({
            sql: 'UPDATE soundtracks SET last_checked_at = ? WHERE id = ?',
            args: [now, id],
          });
          results.alive++;
          results.details.push({ id, title_id, playlist: spotify_playlist_id, status: 'alive' });
        } else {
          await db.execute({
            sql: 'UPDATE soundtracks SET is_active = 0, last_checked_at = ? WHERE id = ?',
            args: [now, id],
          });
          results.dead++;
          results.details.push({ id, title_id, playlist: spotify_playlist_id, status: 'dead', reason });
        }

        results.checked++;
      } catch (err) {
        results.skipped++;
        results.details.push({ id, status: 'error', message: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      ...results,
    });
  } catch (err) {
    console.error('[cron-health-check] Fatal:', err.message);
    return res.status(500).json({ success: false, error: 'Health check failed: ' + err.message });
  }
};
