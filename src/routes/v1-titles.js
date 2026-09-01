const express = require('express');
const router = express.Router();
const { respond, respondError } = require('../response');
const {
  getTitleById,
  getTitleByImdb,
  getTitleByTmdb,
  getTitleBySlug,
  getAllTitles,
  insertOrUpdateTitle,
  insertSoundtrack,
  getSoundtracksForTitle,
  overrideSoundtrackForTitle,
  removeSoundtracksByTitleId,
} = require('../services/soundtrack-db');
const {
  extractPlaylistId,
  generateSlug,
  validateSpotifyPlaylist,
} = require('../services/soundtrack-validator');
const {
  resolveByTmdb,
  resolveByImdb,
  resolveBySlug,
  resolveById,
  resolveByTitleOrSlug,
} = require('../services/soundtrack-resolver');

function formatTitle(t) {
  const out = {
    id: String(t.id),
    name: t.title,
    year: t.year,
  };
  if (t.type) out.type = t.type;
  if (t.imdb_id) out.imdb_id = t.imdb_id;
  if (t.tmdb_id) out.tmdb_id = t.tmdb_id;
  if (t.slug) out.slug = t.slug;
  return out;
}

function formatMusic(soundtracks) {
  return soundtracks.map(s => ({
    id: s.id,
    platform: s.platform || 'spotify',
    type: s.type || 'playlist',
    playlist_id: s.spotify_playlist_id,
    url: s.spotify_url || (s.type === 'album' ? `https://open.spotify.com/album/${s.spotify_playlist_id}` : `https://open.spotify.com/playlist/${s.spotify_playlist_id}`),
    source: s.source || 'official',
    verified: s.verified !== undefined ? Boolean(s.verified) : true,
  }));
}

// 0. Universal Resolve & Auto-Ingest: GET /v1/titles/resolve?title=...&slug=...&year=...&type=...&force=...
router.get('/resolve', async (req, res) => {
  const { title, slug, q, year, type } = req.query;
  const force = req.query.force === 'true';
  const targetTitle = title || q;

  if (!targetTitle && !slug) {
    return respondError(res, 400, 'Parameter "title" (or "q") or "slug" is required');
  }

  try {
    const result = await resolveByTitleOrSlug({
      title: targetTitle,
      slug,
      year,
      type,
      force,
    });

    if (!result || !result.title) {
      return respondError(res, 404, `Could not resolve title for: ${targetTitle || slug}`);
    }

    return respond(res, 200, {
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Failed to resolve title: ${err.message}`);
  }
});

// 1. Resolve by IMDb: GET /v1/titles/imdb/:imdb_id/music
router.get('/imdb/:imdb_id/music', async (req, res) => {
  const { imdb_id } = req.params;
  const force = req.query.force === 'true';
  try {
    const result = await resolveByImdb(imdb_id, force);
    if (!result || !result.title) {
      return respondError(res, 404, `Title not found for IMDb ID: ${imdb_id}`);
    }
    return respond(res, 200, {
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Failed to resolve IMDb ID: ${err.message}`);
  }
});

// 2. Resolve by TMDB: GET /v1/titles/tmdb/:tmdb_id/music
router.get('/tmdb/:tmdb_id/music', async (req, res) => {
  const { tmdb_id } = req.params;
  const { type } = req.query;
  const force = req.query.force === 'true';
  try {
    const result = await resolveByTmdb(tmdb_id, type, force);
    if (!result || !result.title) {
      return respondError(res, 404, `Title not found for TMDB ID: ${tmdb_id}`);
    }
    return respond(res, 200, {
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Failed to resolve TMDB ID: ${err.message}`);
  }
});

// 3. Resolve by Slug: GET /v1/titles/slug/:slug/music
router.get('/slug/:slug/music', async (req, res) => {
  const { slug } = req.params;
  const { title, year, type } = req.query;
  const force = req.query.force === 'true';
  try {
    const result = await resolveByTitleOrSlug({ slug, title, year, type, force });
    if (!result || !result.title) {
      return respondError(res, 404, `Title not found for slug: ${slug}`);
    }
    return respond(res, 200, {
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Failed to resolve slug: ${err.message}`);
  }
});

// 4. Resolve by Internal ID: GET /v1/titles/:id/music
router.get('/:id/music', async (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true';
  try {
    const result = await resolveById(id, force);
    if (!result || !result.title) {
      return respondError(res, 404, `Title not found for ID: ${id}`);
    }
    return respond(res, 200, {
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Failed to resolve ID: ${err.message}`);
  }
});

// 5. Query / List Titles: GET /v1/titles
router.get('/', async (req, res) => {
  const { q, year, type, limit, offset } = req.query;
  try {
    const results = await getAllTitles({
      q,
      year,
      type,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    const enriched = await Promise.all(
      results.titles.map(async t => {
        const music = await getSoundtracksForTitle(t.id);
        return {
          ...formatTitle(t),
          soundtrack_count: music.length,
        };
      })
    );

    return respond(res, 200, {
      total: results.total,
      offset: results.offset,
      limit: results.limit,
      titles: enriched,
    });
  } catch (err) {
    return respondError(res, 500, `Failed listing titles: ${err.message}`);
  }
});

// 6. Manual Override / Update Soundtrack for a Title: PUT /v1/titles/:id/music
router.put('/:id/music', async (req, res) => {
  const { id } = req.params;
  const title = (await getTitleById(id)) || (await getTitleByTmdb(id)) || (await getTitleByImdb(id));
  if (!title) {
    return respondError(res, 404, `Title not found for ID: ${id}`);
  }

  const { spotify_playlist_id, spotify_url, type = 'playlist', source = 'official', verified = true } = req.body || {};
  const rawId = spotify_playlist_id || spotify_url;
  if (!rawId) {
    return respondError(res, 400, 'spotify_playlist_id or spotify_url is required');
  }

  const cleanId = extractPlaylistId(rawId);
  await overrideSoundtrackForTitle(title.id, {
    spotify_playlist_id: cleanId,
    spotify_url: spotify_url || (type === 'album' ? `https://open.spotify.com/album/${cleanId}` : `https://open.spotify.com/playlist/${cleanId}`),
    type,
    source,
    verified,
  });

  const allMusic = await getSoundtracksForTitle(title.id);
  return respond(res, 200, {
    message: 'Soundtrack successfully updated/overridden',
    title: formatTitle(title),
    music: formatMusic(allMusic),
  });
});

// 7. Delete / Unlink Soundtrack: DELETE /v1/titles/:id/music/:soundtrack_id?
router.delete('/:id/music/:soundtrack_id?', async (req, res) => {
  const { id, soundtrack_id } = req.params;
  const title = (await getTitleById(id)) || (await getTitleByTmdb(id)) || (await getTitleByImdb(id));
  if (!title) {
    return respondError(res, 404, `Title not found for ID: ${id}`);
  }

  const removed = await removeSoundtracksByTitleId(title.id, soundtrack_id || null);
  const remaining = await getSoundtracksForTitle(title.id);

  return respond(res, 200, {
    message: `Removed ${removed} soundtrack entry/entries`,
    title: formatTitle(title),
    music: formatMusic(remaining),
  });
});

// 8. Dynamic Ingestion by TMDB ID: POST /v1/titles/ingest/tmdb/:tmdb_id
router.post('/ingest/tmdb/:tmdb_id', async (req, res) => {
  const { tmdb_id } = req.params;
  try {
    const result = await resolveByTmdb(tmdb_id);
    if (!result || !result.title) {
      return respondError(res, 404, `Could not find movie/TV metadata on TMDB for ID: ${tmdb_id}`);
    }
    return respond(res, 200, {
      message: 'Title and soundtrack dynamically ingested from TMDB & Spotify',
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  } catch (err) {
    return respondError(res, 500, `Dynamic ingestion failed: ${err.message}`);
  }
});

// 9. Manual / Custom Ingestion: POST /v1/titles/ingest
router.post('/ingest', async (req, res) => {
  const body = req.body;

  if (body.tmdb_id && !body.title) {
    const result = await resolveByTmdb(body.tmdb_id);
    if (!result || !result.title) {
      return respondError(res, 404, `Could not find metadata on TMDB for ID: ${body.tmdb_id}`);
    }
    return respond(res, 200, {
      message: 'Title dynamically ingested from TMDB',
      title: formatTitle(result.title),
      music: formatMusic(result.soundtracks || []),
    });
  }

  if (!body || !body.title) {
    return respondError(res, 400, 'Title or tmdb_id is required for ingestion');
  }

  try {
    const slug = body.slug || generateSlug(body.title, body.year);
    const { title, isNew: isNewTitle } = await insertOrUpdateTitle({
      id: body.id,
      title: body.title,
      year: body.year,
      type: body.type || 'movie',
      imdb_id: body.imdb_id,
      tmdb_id: body.tmdb_id,
      slug,
    });

    if (body.spotify_playlist_id || body.spotify_url) {
      const rawPlaylistId = body.spotify_playlist_id || body.spotify_url;
      const playlistId = extractPlaylistId(rawPlaylistId);

      const validation = await validateSpotifyPlaylist(playlistId);
      if (!validation.valid) {
        return respondError(res, 400, `Spotify playlist validation failed: ${validation.error}`);
      }

      await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: playlistId,
        spotify_url: body.spotify_url || `https://open.spotify.com/playlist/${playlistId}`,
        source: body.source || 'official',
        verified: body.verified !== undefined ? body.verified : true,
      });
    }

    const allMusic = await getSoundtracksForTitle(title.id);
    return respond(res, isNewTitle ? 201 : 200, {
      message: isNewTitle ? 'Title created' : 'Title updated',
      title: formatTitle(title),
      music: formatMusic(allMusic),
    });
  } catch (err) {
    return respondError(res, 500, `Ingestion failed: ${err.message}`);
  }
});

module.exports = router;
