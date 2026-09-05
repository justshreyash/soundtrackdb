const PROVIDER = 'CNF1G';
const CREATOR = 'shreyash';

/**
 * Standard success response.
 * Preserves exact backward compatibility while exposing telemetry headers.
 */
function respond(res, statusCode, data) {
  const reqId = res.req?.id;

  const payload = {
    provider: PROVIDER,
    creator: CREATOR,
    success: true,
    ...(reqId ? { request_id: reqId } : {}),
    ...data,
  };

  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Cache-Control': 'no-cache',
    'Access-Control-Expose-Headers': 'X-Request-ID, X-Response-Time, X-Cache, X-API-Version',
  }).send(JSON.stringify(payload, null, 2));
}

/**
 * Standard error response.
 * Implements mustToHave.txt sections 13 & 16:
 * - Guarantees 100% backward compatibility: always returns { success: false, error: string }
 * - Enriches with structured error_code, request_id, and error_details
 * - Never leaks internal database/SQL errors to clients
 */
function respondError(res, statusCode, message, errorCode = null, details = null) {
  const req = res.req;
  const reqId = req?.id || null;

  // Determine standard error code if not passed
  let code = errorCode;
  if (!code) {
    if (statusCode === 400) code = 'INVALID_REQUEST';
    else if (statusCode === 404) code = 'TITLE_NOT_FOUND';
    else if (statusCode === 429) code = 'RATE_LIMITED';
    else if (statusCode === 502 || statusCode === 504) code = 'EXTERNAL_PROVIDER_ERROR';
    else code = 'INTERNAL_ERROR';
  }

  // Tag request telemetry for metrics & logging
  if (req?.telemetry) {
    req.telemetry.errorCode = code;
    if (statusCode === 404) req.telemetry.outcome = 'NOT_FOUND';
    else if (statusCode === 400) req.telemetry.outcome = 'INVALID_REQUEST';
    else if (statusCode === 429) req.telemetry.outcome = 'RATE_LIMITED';
    else if (statusCode >= 500) req.telemetry.outcome = 'INTERNAL_ERROR';
  }

  const errorMessage = typeof message === 'string' ? message : (message?.message || 'An error occurred');

  const errorPayload = {
    provider: PROVIDER,
    creator: CREATOR,
    success: false,
    error: errorMessage, // backward compatible string
    error_code: code,
    ...(reqId ? { request_id: reqId } : {}),
    error_details: {
      code,
      message: errorMessage,
      ...(reqId ? { request_id: reqId } : {}),
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).set({
    'Content-Type': 'application/json; charset=utf-8',
    'X-API-Provider': PROVIDER,
    'X-API-Creator': CREATOR,
    'Cache-Control': 'no-cache',
    'Access-Control-Expose-Headers': 'X-Request-ID, X-Response-Time, X-Cache, X-API-Version',
  }).send(JSON.stringify(errorPayload, null, 2));
}

module.exports = {
  respond,
  respondError,
  PROVIDER,
  CREATOR,
};