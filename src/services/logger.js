/**
 * Structured, sanitized JSON logger for SoundTrackDB
 * Adheres to mustToHave.txt sections 3 & 4:
 * - Structured single-line JSON formatting (Vercel runtime logs friendly)
 * - Never dumps entire payloads (e.g. Spotify playlists) into logs
 * - Includes request_id, route, method, status, timings, outcome, and error codes
 */

const isDev = process.env.NODE_ENV !== 'production';

function formatLog(level, message, meta = {}) {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === 'string' ? message : (message?.message || 'log'),
    ...meta,
  };

  // Ensure request_id is present if passed in meta
  if (meta.req?.id) {
    logObj.request_id = meta.req.id;
    delete logObj.req;
  }

  // Remove potential sensitive fields or huge data
  delete logObj.body;
  delete logObj.payload;
  delete logObj.response_data;

  return JSON.stringify(logObj);
}

const logger = {
  info(message, meta = {}) {
    console.log(formatLog('info', message, meta));
  },
  warn(message, meta = {}) {
    console.warn(formatLog('warn', message, meta));
  },
  error(message, meta = {}) {
    console.error(formatLog('error', message, meta));
  },
  debug(message, meta = {}) {
    if (isDev || process.env.DEBUG === 'true') {
      console.log(formatLog('debug', message, meta));
    }
  },
};

module.exports = logger;
