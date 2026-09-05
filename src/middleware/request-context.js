/**
 * Request Context & Observability Middleware
 * Implements mustToHave.txt sections 2, 4, 8, 10 & 15:
 * - Generates unique Request ID (req_xxxxxxxxxxxx) or respects incoming X-Request-ID
 * - High-precision hrtime timing
 * - Sets response headers: X-Request-ID, X-API-Version, X-Response-Time, X-Cache
 * - Structured logging upon response completion
 * - Records metrics without overhead
 */

const crypto = require('crypto');
const logger = require('../services/logger');
const metrics = require('../services/metrics');

const API_VERSION = '1.0.0';

function generateRequestId() {
  return `req_${crypto.randomBytes(6).toString('hex')}`;
}

function requestContext(req, res, next) {
  const reqId = req.headers['x-request-id']
    ? String(req.headers['x-request-id']).trim().slice(0, 64)
    : generateRequestId();

  req.id = reqId;
  req._startHr = process.hrtime.bigint();
  req.telemetry = {
    cacheHit: false,
    externalFetch: false,
    externalFetchMs: null,
    dbLatencyMs: null,
    outcome: null,
    errorCode: null,
  };

  // Immediate identification headers
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-API-Version', API_VERSION);

  // Hook into writeHead to calculate response time & cache header before headers are flushed
  const origWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const durationMs = Number(process.hrtime.bigint() - req._startHr) / 1e6;
      res.setHeader('X-Response-Time', `${durationMs.toFixed(1)}ms`);
      res.setHeader('X-Cache', req.telemetry.cacheHit ? 'HIT' : 'MISS');
    }
    return origWriteHead.apply(this, args);
  };

  // Record metrics and structured log on finish
  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - req._startHr) / 1e6);
    const statusCode = res.statusCode;
    const route = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path}` : (req.route?.path || req.path);

    // Exclude internal UI polling (/api/status-feed), root landing page, and favicon from inflating API metrics
    const isInternalPoll = route === '/api/status-feed' || route === '/' || req.path === '/favicon.svg';
    if (!isInternalPoll) {
      metrics.recordRequest({
        route,
        method: req.method,
        statusCode,
        durationMs,
        cacheHit: req.telemetry.cacheHit,
        externalFetch: req.telemetry.externalFetch,
        externalFetchMs: req.telemetry.externalFetchMs,
        dbLatencyMs: req.telemetry.dbLatencyMs,
        outcome: req.telemetry.outcome,
        errorCode: req.telemetry.errorCode,
        rateLimited: statusCode === 429,
      });
    }

    // Don't log spammy health or status pings in logs unless error
    if ((route === '/health' || route === '/api/status-feed') && statusCode === 200) {
      return;
    }

    const logMeta = {
      request_id: req.id,
      route,
      method: req.method,
      status: statusCode,
      duration_ms: durationMs,
      cache_hit: req.telemetry.cacheHit,
      outcome: req.telemetry.outcome || (statusCode >= 400 ? 'ERROR' : 'SUCCESS'),
    };

    if (req.telemetry.externalFetch) {
      logMeta.external_fetch = true;
      if (req.telemetry.externalFetchMs) {
        logMeta.external_fetch_ms = req.telemetry.externalFetchMs;
      }
    }

    if (req.telemetry.errorCode) {
      logMeta.error_code = req.telemetry.errorCode;
    }

    if (statusCode >= 500) {
      logger.error(`Request failed with status ${statusCode}`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`Request returned client error ${statusCode}`, logMeta);
    } else {
      logger.info(`Request completed`, logMeta);
    }
  });

  next();
}

module.exports = {
  requestContext,
  generateRequestId,
  API_VERSION,
};
