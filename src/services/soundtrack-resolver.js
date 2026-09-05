const {
  getTitleById,
  getTitleByImdb,
  getTitleByTmdb,
  getTitleByAlias,
  getSoundtracksForTitle,
  resolveOrCreateTitle,
  insertSoundtrack,
  removeSoundtracksByTitleId,
} = require('./soundtrack-db');
const { fetchTmdbMetadata, fetchImdbMetadata, searchTmdb } = require('./tmdb');
const { findSoundtrackPlaylist } = require('./soundtrack-finder');
const { generateSlug } = require('./soundtrack-validator');
const singleflight = require('./singleflight');

/**
 * Parse a URL-safe slug into a human-readable title and optional release year.
 * Example: "queen-of-tears" -> { searchTitle: "queen of tears", searchYear: null }
 * Example: "vincenzo-2021" -> { searchTitle: "vincenzo", searchYear: 2021 }
 */
function parseSlug(slug) {
  if (!slug) return { searchTitle: '', searchYear: null };
  const clean = String(slug).trim().toLowerCase();

  const yearMatch = clean.match(/^(.*?)[-_](\d{4})$/);
  if (yearMatch) {
    const y = parseInt(yearMatch[2], 10);
    if (y >= 1900 && y <= 2100) {
      const t = yearMatch[1].replace(/[-_]+/g, ' ').trim();
      return { searchTitle: t, searchYear: y };
    }
  }

  return {
    searchTitle: clean.replace(/[-_]+/g, ' ').trim(),
    searchYear: null,
  };
}

/**
 * Resolve title & soundtrack by TMDB ID with optional force refresh.
 * Uses SingleFlight to prevent concurrent duplicate upstream queries.
 */
async function resolveByTmdb(tmdbId, mediaType, force = false) {
  if (!tmdbId) return null;
  const cleanTmdb = String(tmdbId).trim();
  const flightKey = `tmdb:${cleanTmdb}:${mediaType || ''}:${force}`;

  return singleflight.do(flightKey, async () => {
    const startMs = Date.now();
    let title = await getTitleByTmdb(cleanTmdb);
    if (title && mediaType && (title.type || '').toLowerCase() !== mediaType.toLowerCase()) {
      title = null;
    }
    let soundtracks = title ? await getSoundtracksForTitle(title.id) : [];

    if (!force && title && soundtracks.length > 0) {
      return {
        title,
        soundtracks,
        _telemetry: { cacheHit: true, externalFetch: false, externalFetchMs: 0 },
      };
    }

    // Fetch metadata from TMDB if not in DB
    const externalStart = Date.now();
    if (!title) {
      const meta = await fetchTmdbMetadata(cleanTmdb, mediaType);
      if (meta && meta.title) {
        const saved = await resolveOrCreateTitle(meta);
        title = saved.title;
      }
    }

    if (!title) return null;

    // Search Spotify if forced or no active soundtrack exists
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
          match_type: 'exact',
        });
        soundtracks = [savedSt.soundtrack];
      }
    }

    const externalFetchMs = Date.now() - externalStart;
    return {
      title,
      soundtracks,
      _telemetry: {
        cacheHit: false,
        externalFetch: true,
        externalFetchMs,
      },
    };
  });
}

/**
 * Resolve title & soundtrack by IMDb ID with optional force refresh.
 * Uses SingleFlight to prevent concurrent duplicate upstream queries.
 */
async function resolveByImdb(imdbId, force = false) {
  if (!imdbId) return null;
  const cleanImdb = String(imdbId).trim().toLowerCase();
  const flightKey = `imdb:${cleanImdb}:${force}`;

  return singleflight.do(flightKey, async () => {
    const startMs = Date.now();
    let title = await getTitleByImdb(cleanImdb);
    let soundtracks = title ? await getSoundtracksForTitle(title.id) : [];

    if (!force && title && soundtracks.length > 0) {
      return {
        title,
        soundtracks,
        _telemetry: { cacheHit: true, externalFetch: false, externalFetchMs: 0 },
      };
    }

    const externalStart = Date.now();
    if (!title) {
      const meta = await fetchImdbMetadata(cleanImdb);
      if (meta && meta.title) {
        const saved = await resolveOrCreateTitle(meta);
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
          match_type: 'exact',
        });
        soundtracks = [savedSt.soundtrack];
      }
    }

    const externalFetchMs = Date.now() - externalStart;
    return {
      title,
      soundtracks,
      _telemetry: {
        cacheHit: false,
        externalFetch: true,
        externalFetchMs,
      },
    };
  });
}

/**
 * Universal auto-ingest resolver by Title or Slug.
 * Resolves against Turso DB -> TMDB search -> Spotify direct fallback.
 * SingleFlight prevents duplicate auto-ingest races.
 */
async function resolveByTitleOrSlug({ slug, title: rawTitle, year: rawYear, type: rawType, force = false } = {}) {
  const parsed = slug ? parseSlug(slug) : { searchTitle: '', searchYear: null };
  const searchTitle = (rawTitle || parsed.searchTitle || '').trim();
  const searchYear = rawYear ? parseInt(rawYear, 10) : parsed.searchYear;
  const searchType = rawType || null;
  const targetSlug = slug || (searchTitle ? generateSlug(searchTitle, searchYear) : null);

  if (!searchTitle && !targetSlug) return null;

  const flightKey = `slug:${targetSlug || searchTitle}:${searchYear || ''}:${force}`;

  return singleflight.do(flightKey, async () => {
    // 1. Check Turso DB via title_aliases
    let title = targetSlug ? await getTitleByAlias(targetSlug) : null;
    let soundtracks = title ? await getSoundtracksForTitle(title.id) : [];

    if (!force && title && soundtracks.length > 0) {
      return {
        title,
        soundtracks,
        _telemetry: { cacheHit: true, externalFetch: false, externalFetchMs: 0 },
      };
    }

    const externalStart = Date.now();

    // 2. Title exists in DB but has no active soundtracks (or forced)
    if (title && (force || soundtracks.length === 0)) {
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
          match_type: 'agnostic',
        });
        soundtracks = [savedSt.soundtrack];
      }
      return {
        title,
        soundtracks,
        _telemetry: {
          cacheHit: false,
          externalFetch: true,
          externalFetchMs: Date.now() - externalStart,
        },
      };
    }

    // 3. Not in Turso DB -> Auto-Ingest Pipeline
    // 3a. Search TMDB
    const tmdbMatch = await searchTmdb(searchTitle, searchYear, searchType);
    if (tmdbMatch && tmdbMatch.tmdb_id) {
      const tmdbRes = await resolveByTmdb(tmdbMatch.tmdb_id, tmdbMatch.type || searchType, force);
      if (tmdbRes && tmdbRes.title) {
        return tmdbRes;
      }
    }

    // 3b. TMDB has no match -> Direct Spotify search + Turso persistence
    const found = await findSoundtrackPlaylist(searchTitle, searchYear);
    const cleanYear = searchYear || new Date().getFullYear();
    const cleanSlug = targetSlug || generateSlug(searchTitle, cleanYear);

    const savedTitle = await resolveOrCreateTitle({
      title: searchTitle,
      year: cleanYear,
      type: searchType || 'movie',
      slug: cleanSlug,
      imdb_id: null,
      tmdb_id: null,
    });

    title = savedTitle.title;
    soundtracks = [];

    if (found) {
      const savedSt = await insertSoundtrack({
        title_id: title.id,
        spotify_playlist_id: found.spotify_playlist_id,
        spotify_url: found.spotify_url,
        type: found.type || 'playlist',
        source: found.source || 'official',
        verified: found.verified,
        match_type: 'agnostic',
      });
      soundtracks = [savedSt.soundtrack];
    }

    return {
      title,
      soundtracks,
      _telemetry: {
        cacheHit: false,
        externalFetch: true,
        externalFetchMs: Date.now() - externalStart,
      },
    };
  });
}

/**
 * Resolve title & soundtrack by Slug with auto-ingestion fallback.
 */
async function resolveBySlug(slug, force = false) {
  return resolveByTitleOrSlug({ slug, force });
}

/**
 * Resolve title & soundtrack by internal ID with optional force refresh.
 */
async function resolveById(id, force = false) {
  if (!id) return null;
  const flightKey = `id:${id}:${force}`;

  return singleflight.do(flightKey, async () => {
    let title = await getTitleById(id);
    if (!title) return null;

    let soundtracks = await getSoundtracksForTitle(title.id);
    if (!force && soundtracks.length > 0) {
      return {
        title,
        soundtracks,
        _telemetry: { cacheHit: true, externalFetch: false, externalFetchMs: 0 },
      };
    }

    const externalStart = Date.now();
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
        match_type: 'exact',
      });
      soundtracks = [savedSt.soundtrack];
    }

    return {
      title,
      soundtracks,
      _telemetry: {
        cacheHit: false,
        externalFetch: true,
        externalFetchMs: Date.now() - externalStart,
      },
    };
  });
}

module.exports = {
  parseSlug,
  resolveByTmdb,
  resolveByImdb,
  resolveBySlug,
  resolveById,
  resolveByTitleOrSlug,
};
