const { fetchEmbedEntity } = require('../spotify-graphql');

function extractPlaylistId(input) {
  if (!input) return null;
  const str = String(input).trim();

  // URI: spotify:playlist:6QlxaUG3pKLPJPzoWEhZuG
  if (str.startsWith('spotify:playlist:')) {
    return str.split(':')[2];
  }

  // URL: https://open.spotify.com/playlist/6QlxaUG3pKLPJPzoWEhZuG?si=...
  const urlMatch = str.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Raw alphanumeric ID (typically 22 chars)
  if (/^[a-zA-Z0-9]{20,24}$/.test(str)) {
    return str;
  }

  return str;
}

function generateSlug(title, year) {
  const cleanTitle = String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  if (year) {
    return `${cleanTitle}-${year}`;
  }
  return cleanTitle;
}

async function validateSpotifyPlaylist(playlistId) {
  const cleanId = extractPlaylistId(playlistId);
  if (!cleanId) {
    return { valid: false, error: 'Invalid playlist ID format' };
  }

  try {
    const embed = await fetchEmbedEntity('playlist', cleanId);
    if (embed && (embed.name || embed.title || embed.trackList)) {
      return {
        valid: true,
        playlistId: cleanId,
        name: embed.name || embed.title || '',
        trackCount: embed.trackList?.length || 0,
        thumbnail: embed.visualIdentity?.image?.[0]?.url || embed.coverArt?.sources?.[0]?.url || '',
      };
    }
  } catch (err) {
    // Fallback error
  }

  // If embed fails, as long as cleanId has valid Spotify ID format, allow ingestion with verified flag
  if (/^[a-zA-Z0-9]{20,24}$/.test(cleanId)) {
    return {
      valid: true,
      playlistId: cleanId,
      name: '',
      trackCount: 0,
    };
  }

  return { valid: false, error: 'Could not resolve playlist on Spotify' };
}

module.exports = {
  extractPlaylistId,
  generateSlug,
  validateSpotifyPlaylist,
};
