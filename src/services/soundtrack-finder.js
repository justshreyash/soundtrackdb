const { spotifyGraphQL, SEARCH_HASH } = require('../spotify-graphql');
const { validateSpotifyPlaylist } = require('./soundtrack-validator');

/**
 * Searches Spotify for the best soundtrack playlist (or OST album fallback) matching a movie/TV title.
 */
async function findSoundtrackPlaylist(title, year = '') {
  if (!title) return null;

  const queries = [
    `${title} soundtrack`,
    `${title} OST`,
    `${title} official soundtrack`,
    `${title} Original Soundtrack`,
  ];
  if (year) {
    queries.push(`${title} ${year} soundtrack`);
    queries.push(`${title} ${year} OST`);
  }

  // 1. Search for Soundtrack Playlists
  for (const query of queries) {
    try {
      const raw = await spotifyGraphQL('searchDesktop', SEARCH_HASH, {
        searchTerm: query,
        offset: 0,
        limit: 10,
        numberOfTopResults: 3,
        includeAudiobooks: false,
        includeArtistHasConcertsField: false,
        includePreReleases: true,
        includeLocalConcertsField: false,
      });

      const playlists = raw?.data?.searchV2?.playlists?.items || [];
      if (!playlists.length) continue;

      const titleLower = title.toLowerCase();

      let bestMatch = null;
      let highestScore = -1;

      for (const item of playlists) {
        const p = item.data;
        if (!p || !p.uri) continue;

        const pName = (p.name || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pId = p.uri.split(':').pop();

        let score = 0;

        // Exact / Partial title match
        if (pName.includes(titleLower)) {
          score += 50;
        }

        // Official / Soundtrack keywords
        if (pName.includes('soundtrack') || pDesc.includes('soundtrack') || pName.includes('ost')) {
          score += 20;
        }
        if (pName.includes('official') || pDesc.includes('official') || pName.includes('netflix') || pName.includes('spotify')) {
          score += 15;
        }
        if (year && (pName.includes(String(year)) || pDesc.includes(String(year)))) {
          score += 10;
        }

        if (score > highestScore) {
          highestScore = score;
          const isOfficial = pName.includes('official') || pDesc.includes('official') || pName.includes('spotify');
          bestMatch = {
            id: pId,
            name: p.name,
            isOfficial,
          };
        }
      }

      if (bestMatch && highestScore >= 50) {
        const val = await validateSpotifyPlaylist(bestMatch.id);
        if (val.valid) {
          return {
            spotify_playlist_id: bestMatch.id,
            spotify_url: `https://open.spotify.com/playlist/${bestMatch.id}`,
            type: 'playlist',
            source: bestMatch.isOfficial ? 'official' : 'community',
            verified: bestMatch.isOfficial,
            playlist_name: bestMatch.name,
          };
        }
      }
    } catch (err) {
      console.warn(`Soundtrack playlist search failed for "${query}":`, err.message);
    }
  }

  // 2. Fallback: Search for Official OST Album on Spotify if no playlist matched
  const albumQueries = [
    `${title} (Original Motion Picture Soundtrack)`,
    `${title} (Original Television Soundtrack)`,
    `${title} (Soundtrack from the TV Series)`,
    `${title} OST`,
  ];

  for (const albumQuery of albumQueries) {
    try {
      const rawAlbum = await spotifyGraphQL('searchDesktop', SEARCH_HASH, {
        searchTerm: albumQuery,
        offset: 0,
        limit: 5,
        numberOfTopResults: 1,
        includeAudiobooks: false,
        includeArtistHasConcertsField: false,
        includePreReleases: true,
        includeLocalConcertsField: false,
      });

      const albums = rawAlbum?.data?.searchV2?.albumsV2?.items || [];
      const titleLower = title.toLowerCase();

      for (const item of albums) {
        const a = item.data;
        if (!a || !a.uri) continue;
        const aName = (a.name || '').toLowerCase();
        const aId = a.uri.split(':').pop();

        if (aName.includes(titleLower) && (aName.includes('soundtrack') || aName.includes('score') || aName.includes('ost') || aName.includes('music from'))) {
          return {
            spotify_playlist_id: aId,
            spotify_url: `https://open.spotify.com/album/${aId}`,
            type: 'album',
            source: 'official',
            verified: true,
            playlist_name: a.name,
          };
        }
      }
    } catch (err) {
      console.warn(`OST Album fallback search failed for "${albumQuery}":`, err.message);
    }
  }

  return null;
}

module.exports = {
  findSoundtrackPlaylist,
};
