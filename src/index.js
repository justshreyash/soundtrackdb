require('dotenv').config();
const express = require('express');
const path = require('path');
const { startScheduler, getToken } = require('./token-manager');
const { respond, respondError, PROVIDER, CREATOR } = require('./response');

const app = express();
const PORT = process.env.PORT || 3000;
const REFRESH_INTERVAL = parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// GET /api documentation
app.get('/api', (req, res) => {
  respond(res, 200, {
    name: 'Sptfy API',
    description: 'Free, unlimited Spotify Search & Metadata API. Anonymous TOTP-based token generation refreshed every 30 minutes. No credentials required.',
    version: '1.0.0',
    note: 'Tokens are ephemeral and automatically rotated every 30 minutes.',
    endpoints: {
      token: 'GET /api/token',
      search: 'GET /api/search?q={query}&type=track|album|artist|playlist&limit=20&offset=0',
      track: 'GET /api/track/:id',
      album: 'GET /api/album/:id',
      playlist: 'GET /api/playlist/:id',
      artist: 'GET /api/artist/:id',
      'artist-tracks': 'GET /api/artist/:id/top-tracks',
      health: 'GET /api/health',
      'soundtrack-resolve': 'GET /v1/titles/resolve?title={title}&year={year}&type={type}',
      'soundtrack-by-imdb': 'GET /v1/titles/imdb/:imdb_id/music',
      'soundtrack-by-tmdb': 'GET /v1/titles/tmdb/:tmdb_id/music',
      'soundtrack-by-slug': 'GET /v1/titles/slug/:slug/music',
      'soundtrack-by-id': 'GET /v1/titles/:id/music',
      'soundtrack-list': 'GET /v1/titles',
    },
  });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  respond(res, 200, {
    status: 'ok',
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// GET /api/token
app.get('/api/token', async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.query.refresh === 'true';
    const token = await getToken(force);
    if (!token) {
      return respondError(res, 503, 'Could not obtain Spotify access token, please try again shortly');
    }
    respond(res, 200, {
      note: 'Use this token in Authorization: Bearer <access_token>',
      access_token: token,
      token_type: 'Bearer',
      usage: {
        search: 'curl -H "Authorization: Bearer <token>" https://api.spotify.com/v1/search?q=query&type=track',
        track: 'curl -H "Authorization: Bearer <token>" https://api.spotify.com/v1/tracks/{id}',
        album: 'curl -H "Authorization: Bearer <token>" https://api.spotify.com/v1/albums/{id}',
        playlist: 'curl -H "Authorization: Bearer <token>" https://api.spotify.com/v1/playlists/{id}',
        artist: 'curl -H "Authorization: Bearer <token>" https://api.spotify.com/v1/artists/{id}',
      },
    });
  } catch (err) {
    respondError(res, 500, err.message);
  }
});

// Routes
app.use('/api/search', require('./routes/search'));
app.use('/api/track', require('./routes/track'));
app.use('/api/album', require('./routes/album'));
app.use('/api/playlist', require('./routes/playlist'));
app.use('/api/artist', require('./routes/artist'));

// Movie Soundtrack API v1 Routes
app.use('/v1/titles', require('./routes/v1-titles'));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
  respondError(res, 404, 'Endpoint not found. See /api for available endpoints.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startScheduler(REFRESH_INTERVAL);
});