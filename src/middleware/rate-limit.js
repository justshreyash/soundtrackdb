/**
 * Rate-limit middleware — sliding-window in-memory implementation.
 *
 * Strategy: per-IP token bucket with a 60-second sliding window.
 * When RATE_LIMIT_ENABLED=false (default/dev), this is a no-op.
 * When RATE_LIMIT_ENABLED=true, requests exceeding RATE_LIMIT_REQUESTS_PER_MIN
 * per IP per 60s are rejected with 429 + Retry-After.
 *
 * Tradeoffs:
 *  ✅ Zero new dependencies
 *  ✅ Works immediately on any Node host
 *  ⚠️  Not shared across multiple instances (fine for Vercel free-tier single-instance)
 *  TODO (scale): Replace Map with Upstash Redis (@upstash/ratelimit) when you need
 *  multi-instance distribution. No route-file changes required — just swap this file.
 */

const { respondError } = require('../response');

// ── Config ────────────────────────────────────────────────────────────────────
const WINDOW_MS = 60 * 1000; // 60-second window
const getLimit = () => parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MIN || '60', 10);
const isEnabled = () => process.env.RATE_LIMIT_ENABLED === 'true';

// ── State: Map<ip, { count, windowStart }> ────────────────────────────────────
const ipMap = new Map();

// Purge stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of ipMap.entries()) {
    if (now - state.windowStart > WINDOW_MS * 2) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // .unref() so this timer doesn't block process exit

// ── Middleware ────────────────────────────────────────────────────────────────
function rateLimit(req, res, next) {
  if (!isEnabled()) return next();

  const limit = getLimit();

  // Resolve the real client IP (respects X-Forwarded-For from Vercel/proxies)
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const now = Date.now();
  const state = ipMap.get(ip);

  if (!state || now - state.windowStart > WINDOW_MS) {
    // New window — reset
    ipMap.set(ip, { count: 1, windowStart: now });
    return next();
  }

  state.count++;

  if (state.count > limit) {
    const retryAfterSeconds = Math.ceil((state.windowStart + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((state.windowStart + WINDOW_MS) / 1000)));
    return respondError(
      res,
      429,
      `Rate limit exceeded. Maximum ${limit} requests per minute. Retry after ${retryAfterSeconds}s.`
    );
  }

  // Set informational headers on allowed requests
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - state.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil((state.windowStart + WINDOW_MS) / 1000)));

  return next();
}

module.exports = { rateLimit };
