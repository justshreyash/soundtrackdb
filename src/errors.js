/**
 * SoundTrackDB Error Codes Taxonomy
 * Standardized error categories per mustToHave.txt spec section 13
 */

const ErrorCodes = {
  INVALID_IMDB_ID: 'INVALID_IMDB_ID',
  INVALID_TMDB_ID: 'INVALID_TMDB_ID',
  INVALID_SLUG: 'INVALID_SLUG',
  INVALID_INTERNAL_ID: 'INVALID_INTERNAL_ID',
  INVALID_REQUEST: 'INVALID_REQUEST',
  TITLE_NOT_FOUND: 'TITLE_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  EXTERNAL_PROVIDER_TIMEOUT: 'EXTERNAL_PROVIDER_TIMEOUT',
  EXTERNAL_PROVIDER_ERROR: 'EXTERNAL_PROVIDER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || ErrorCodes.INTERNAL_ERROR;
    this.details = details;
  }
}

module.exports = {
  ErrorCodes,
  ApiError,
};
