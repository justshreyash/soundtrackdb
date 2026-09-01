const {
  getTitleById,
  getTitleByImdb,
  getTitleByTmdb,
  getTitleBySlug,
  getSoundtracksForTitle,
  insertOrUpdateTitle,
  insertSoundtrack,
  removeSoundtracksByTitleId,
} = require('./soundtrack-db');
const { fetchTmdbMetadata, fetchImdbMetadata } = require('./tmdb');
const { findSoundtrackPlaylist } = require('./soundtrack-finder');

/**
 * Resolve title & soundtrack by TMDB ID with optional force refresh.
 */
async function resolveByTmdb(tmdbId, mediaType, force = false) {
  if (!tmdbId) return null;
  const cleanTmdb = String(tmdbId).trim();

  let title = await getTitleByTmdb(cleanTmdb);
  if (title && mediaType && (title.type || '').toLowerCase() !== mediaType.toLowerCase()) {
    title = null;
  }
  let soundtracks = title ? await getSoundtracksForTitle(title.id) : [];

  if (!force && title && soundtracks.length > 0) {
    return { title, soundtracks };
  }

  // Fetch metadata from TMDB if not in DB
  if (!title) {
    const meta = await fetchTmdbMetadata(cleanTmdb, mediaType);
    if (meta && meta.title) {
      const saved = await insertOrUpdateTitle(meta);
      title = saved.title;
    }
  }

  if (!title) return null;

  // Search Spotify if forced or no soundtrack exists
  if (force || soundtracks.length === 0) {
    const found = await findSoundtrackPlaylist(title.title, title.year);
    if (found) {
      if (force) {
        await removeSoundtracksByTitleId(title.id);
      }
      const savedSt = await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: found.spotify_playlist_id,
        spotify_url: found.spotify_url,
        type: found.type || 'playlist',
        source: found.source || 'official',
        verified: found.verified,
      });
      soundtracks = [savedSt.soundtrack];
    }
  }

  return { title, soundtracks };
}

/**
 * Resolve title & soundtrack by IMDb ID with optional force refresh.
 */
async function resolveByImdb(imdbId, force = false) {
  if (!imdbId) return null;
  const cleanImdb = String(imdbId).trim().toLowerCase();

  let title = await getTitleByImdb(cleanImdb);
  let soundtracks = title ? await getSoundtracksForTitle(title.id) : [];

  if (!force && title && soundtracks.length > 0) {
    return { title, soundtracks };
  }

  if (!title) {
    const meta = await fetchImdbMetadata(cleanImdb);
    if (meta && meta.title) {
      const saved = await insertOrUpdateTitle(meta);
      title = saved.title;
    }
  }

  if (!title) return null;

  if (force || soundtracks.length === 0) {
    const found = await findSoundtrackPlaylist(title.title, title.year);
    if (found) {
      if (force) {
        await removeSoundtracksByTitleId(title.id);
      }
      const savedSt = await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: found.spotify_playlist_id,
        spotify_url: found.spotify_url,
        type: found.type || 'playlist',
        source: found.source || 'official',
        verified: found.verified,
      });
      soundtracks = [savedSt.soundtrack];
    }
  }

  return { title, soundtracks };
}

/**
 * Resolve title & soundtrack by Slug with optional force refresh.
 */
async function resolveBySlug(slug, force = false) {
  if (!slug) return null;
  let title = await getTitleBySlug(slug);
  if (!title) return null;

  let soundtracks = await getSoundtracksForTitle(title.id);
  if (force || soundtracks.length === 0) {
    const found = await findSoundtrackPlaylist(title.title, title.year);
    if (found) {
      if (force) {
        await removeSoundtracksByTitleId(title.id);
      }
      const savedSt = await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: found.spotify_playlist_id,
        spotify_url: found.spotify_url,
        type: found.type || 'playlist',
        source: found.source || 'official',
        verified: found.verified,
      });
      soundtracks = [savedSt.soundtrack];
    }
  }

  return { title, soundtracks };
}

/**
 * Resolve title & soundtrack by internal ID with optional force refresh.
 */
async function resolveById(id, force = false) {
  if (!id) return null;
  let title = await getTitleById(id);
  if (!title) return null;

  let soundtracks = await getSoundtracksForTitle(title.id);
  if (force || soundtracks.length === 0) {
    const found = await findSoundtrackPlaylist(title.title, title.year);
    if (found) {
      if (force) {
        await removeSoundtracksByTitleId(title.id);
      }
      const savedSt = await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: found.spotify_playlist_id,
        spotify_url: found.spotify_url,
        type: found.type || 'playlist',
        source: found.source || 'official',
        verified: found.verified,
      });
      soundtracks = [savedSt.soundtrack];
    }
  }

  return { title, soundtracks };
}

module.exports = {
  resolveByTmdb,
  resolveByImdb,
  resolveBySlug,
  resolveById,
};
