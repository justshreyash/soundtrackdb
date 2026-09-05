require('dotenv').config();
const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { startScheduler, getToken } = require('./token-manager');
const { respond, respondError, PROVIDER, CREATOR } = require('./response');
const { rateLimit } = require('./middleware/rate-limit');
const { requestContext, API_VERSION } = require('./middleware/request-context');
const { ErrorCodes } = require('./errors');
const { db, initDb } = require('./services/soundtrack-db');
const metrics = require('./services/metrics');
const packageJson = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3000;
const REFRESH_INTERVAL = parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30');

// Git commit resolution
function getGitCommit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', timeout: 1000 }).trim();
  } catch {
    return 'development';
  }
}
const GIT_COMMIT = getGitCommit();

// Core middleware
app.use(express.json());

// URL restoration & normalization for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (
    req.url.startsWith('/api/index.js') ||
    req.url.startsWith('/api/index') ||
    req.url.startsWith('/src/index.js') ||
    req.url === 'src/index.js'
  ) {
    const original =
      req.headers['x-matched-path'] ||
      req.headers['x-forwarded-uri'] ||
      req.headers['x-vercel-matched-path'];
    if (original) {
      const qIndex = req.url.indexOf('?');
      if (qIndex !== -1 && !original.includes('?')) {
        req.url = original + req.url.slice(qIndex);
      } else {
        req.url = original;
      }
    } else {
      req.url = req.url.replace(/^\/(?:api\/index(?:\.js)?|src\/index(?:\.js)?)/, '') || '/';
    }
  }
  next();
});

app.use(requestContext);
app.use(express.static(path.join(__dirname, '../public')));

// Intentional CORS middleware (mustToHave.txt section 17)
app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time, X-Cache, X-API-Version, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ─── Phase 2 Health & Version Endpoints (mustToHave.txt sections 5 & 6) ────────

// GET /health — lightweight liveness probe (no external DB calls)
app.get('/health', (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  respond(res, 200, {
    status: 'ok',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Backward compatibility: GET /api/health
app.get('/api/health', (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  respond(res, 200, {
    status: 'ok',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// GET /health/db — Turso database readiness probe & latency measurement
app.get('/health/db', async (req, res) => {
  const start = Date.now();
  try {
    await initDb();
    await db.execute('SELECT 1;');
    const latencyMs = Date.now() - start;
    if (req.telemetry) {
      req.telemetry.dbLatencyMs = latencyMs;
      req.telemetry.cacheHit = true;
    }
    respond(res, 200, {
      status: 'ok',
      database: 'reachable',
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (req.telemetry) {
      req.telemetry.dbLatencyMs = latencyMs;
      req.telemetry.outcome = 'DATABASE_FAILURE';
    }
    respondError(
      res,
      503,
      'Database connectivity check failed',
      ErrorCodes.DATABASE_ERROR,
      { error: err.message, latency_ms: latencyMs }
    );
  }
});

// GET /version — application version and environment metadata
app.get('/version', (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  respond(res, 200, {
    version: packageJson.version,
    environment: process.env.NODE_ENV || 'development',
    git_commit: GIT_COMMIT,
  });
});

// ─── Phase 5 Observability & Metrics Endpoints (mustToHave.txt section 10 & 11) ─

// GET /api/metrics — rolling percentile latency & resolution statistics
app.get('/api/metrics', (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  const data = metrics.getMetrics();
  respond(res, 200, data);
});

// GET /api/status-feed — real-time operational feed for status widget
app.get('/api/status-feed', async (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  const data = metrics.getMetrics();

  let dbStatus = 'operational';
  let dbLatency = null;
  try {
    const dbStart = Date.now();
    await db.execute('SELECT 1;');
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'degraded';
  }

  const freshFetchSuccessRate = data.data_resolution.fresh_fetch_success_rate_pct;
  const dataResolutionStatus = freshFetchSuccessRate >= 90 ? 'operational' : 'degraded';

  respond(res, 200, {
    services: {
      api: { status: 'operational' },
      database: { status: dbStatus, latency_ms: dbLatency },
      data_resolution: {
        status: dataResolutionStatus,
        cache_hit_rate_pct: data.data_resolution.cache_hit_rate_pct,
        fresh_fetch_success_rate_pct: freshFetchSuccessRate,
      },
    },
    metrics_summary: {
      uptime_seconds: Math.floor(process.uptime()),
      total_requests: data.total_requests,
      p50_ms: data.latency.total.p50,
      p95_ms: data.latency.total.p95,
      p99_ms: data.latency.total.p99,
    },
  });
});

// ─── Phase 6 OpenAPI & Interactive Docs (mustToHave.txt section 7) ─────────────

// GET /openapi.json
app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/openapi.json'));
});

// GET /docs — Scalar interactive API documentation
app.get('/docs', (req, res) => {
  res.send(`<!doctype html>
<html>
  <head>
    <title>SoundTrackDB API Reference & Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      body { margin: 0; background: #09090b; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json" data-theme="kepler"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
});

// GET /api documentation (JSON summary for backward compatibility)
app.get('/api', (req, res) => {
  if (req.telemetry) req.telemetry.cacheHit = true;
  respond(res, 200, {
    name: 'SoundTrackDB API',
    description: 'Movie & TV Soundtrack API mapping IMDb, TMDB, and titles to verified Spotify soundtrack playlists.',
    version: packageJson.version,
    git_commit: GIT_COMMIT,
    docs: '/docs',
    openapi: '/openapi.json',
    endpoints: {
      health: 'GET /health',
      'health-db': 'GET /health/db',
      version: 'GET /version',
      docs: 'GET /docs',
      metrics: 'GET /api/metrics',
      status: 'GET /api/status-feed',
      'soundtrack-resolve': 'GET /v1/titles/resolve?title={title}&year={year}&type={type}',
      'soundtrack-by-imdb': 'GET /v1/titles/imdb/:imdb_id/music',
      'soundtrack-by-tmdb': 'GET /v1/titles/tmdb/:tmdb_id/music',
      'soundtrack-by-slug': 'GET /v1/titles/slug/:slug/music',
      'soundtrack-by-id': 'GET /v1/titles/:id/music',
    },
  });
});

// GET /api/token — Internal maintenance probe only (strictly protected from public access)
app.get('/api/token', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_SECRET;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
  const secretHeader = req.headers['x-internal-secret'] || '';
  const tokenFromQuery = req.query.secret || '';

  // Return 404 to hide endpoint existence from public crawlers and scrapers
  if (cronSecret && tokenFromHeader !== cronSecret && secretHeader !== cronSecret && tokenFromQuery !== cronSecret) {
    return respondError(res, 404, 'Endpoint not found. See /api or /docs for available endpoints.', ErrorCodes.TITLE_NOT_FOUND);
  }

  try {
    const force = req.query.force === 'true' || req.query.refresh === 'true';
    const token = await getToken(force);
    if (!token) {
      return respondError(res, 503, 'Could not obtain Spotify access token, please try again shortly', ErrorCodes.EXTERNAL_PROVIDER_ERROR);
    }
    if (req.telemetry) req.telemetry.cacheHit = true;
    respond(res, 200, {
      access_token: token,
      token_type: 'Bearer',
      internal: true,
    });
  } catch (err) {
    respondError(res, 500, 'Internal server error.', ErrorCodes.INTERNAL_ERROR);
  }
});

// Movie Soundtrack API v1 Routes — rate-limit wired here
app.use('/v1', rateLimit);
app.use('/v1/titles', require('./routes/v1-titles'));

// Cron routes
app.use('/cron', require('./routes/cron'));

// Developer Early Access / Waitlist routes
app.use('/api', require('./routes/subscribe'));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
  respondError(res, 404, 'Endpoint not found. See /api or /docs for available endpoints.', ErrorCodes.TITLE_NOT_FOUND);
});

// Global error handler — MUST be last, MUST have 4 params (err, req, res, next)
// Never exposes err.message or stack traces in production (mustToHave.txt section 16)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.error('[Unhandled Error]', err.stack || err.message);
  } else {
    console.error('[Unhandled Error]', err.message);
  }
  respondError(res, 500, 'Internal server error.', ErrorCodes.INTERNAL_ERROR);
});

// Start server locally or export for Vercel Serverless Function
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    startScheduler(REFRESH_INTERVAL);
  });
}

module.exports = app;