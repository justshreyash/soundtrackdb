const PROVIDER = 'CNF1G';
const CREATOR = 'shreyash';

/**
 * Standard success response.
 * No CORS headers — this is a server-to-server API.
 * Cache-Control is intentionally 'no-cache' here; per-endpoint overrides
 * (e.g. s-maxage=86400 on music endpoints) are set in the route handlers.
 */
function respond(res, statusCode, data) {
  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Cache-Control': 'no-cache',
  }).send(JSON.stringify({
    provider: PROVIDER,
    creator: CREATOR,
    success: true,
    ...data,
  }, null, 2));
}

/**
 * Standard error response.
 * Always returns { success: false, error: "..." }.
 * Never include internal details (err.message, stack) here — do that in the caller's log only.
 */
function respondError(res, statusCode, message) {
  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Cache-Control': 'no-cache',
  }).send(JSON.stringify({
    provider: PROVIDER,
    creator: CREATOR,
    success: false,
    error: message,
  }, null, 2));
}

module.exports = {
  respond,
  respondError,
  PROVIDER,
  CREATOR,
};