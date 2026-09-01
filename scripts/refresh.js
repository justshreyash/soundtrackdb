require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getSpotifyToken } = require('../src/totp');
const { commitToken } = require('../src/github');

(async () => {
  try {
    const token = await getSpotifyToken();
    await commitToken(token);
    console.log('Token refreshed successfully');
  } catch (err) {
    console.error('Failed to refresh token:', err.message);
    process.exit(1);
  }
})();