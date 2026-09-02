/**
 * Route parameter validators.
 *
 * Each export is an Express middleware that validates a specific route param
 * and returns a clean 400 before the route handler ever runs. This means:
 *  - No DB calls for garbage input
 *  - No 500s or stack traces from malformed IDs
 *  - Consistent error shape: { success: false, error: "..." }
 */

const { respondError } = require('../response');

// ─── IMDb ID ──────────────────────────────────────────────────────────────────
// Valid examples: tt1234567, tt12345678
// Must start with "tt" followed by 7–8 digits
const IMDB_RE = /^tt\d{7,8}$/i;

function validateImdbId(req, res, next) {
  const id = (req.params.imdb_id || '').trim();
  if (!IMDB_RE.test(id)) {
    return respondError(
      res,
      400,
      `Invalid IMDb ID "${id}". Expected format: tt followed by 7–8 digits (e.g. tt21192188).`
    );
  }
  next();
}

// ─── TMDB ID ─────────────────────────────────────────────────────────────────
// Valid examples: 993710, 12345
// Numeric only, 1–10 digits
const TMDB_RE = /^\d{1,10}$/;

function validateTmdbId(req, res, next) {
  const id = (req.params.tmdb_id || '').trim();
  if (!TMDB_RE.test(id)) {
    return respondError(
      res,
      400,
      `Invalid TMDB ID "${id}". Expected a numeric ID (e.g. 993710).`
    );
  }
  next();
}

// ─── Slug ─────────────────────────────────────────────────────────────────────
// Valid examples: back-in-action-2025, vincenzo-2021
// Lowercase alphanumeric + hyphens, 1–120 chars
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,118}[a-z0-9]$|^[a-z0-9]$/;

function validateSlug(req, res, next) {
  const slug = (req.params.slug || '').trim().toLowerCase();
  if (!slug || !SLUG_RE.test(slug)) {
    return respondError(
      res,
      400,
      `Invalid slug "${req.params.slug}". Expected lowercase alphanumeric with hyphens (e.g. back-in-action-2025).`
    );
  }
  next();
}

// ─── Internal numeric ID ──────────────────────────────────────────────────────
// Valid examples: 1, 42, 999
// Numeric only, 1–10 digits
const INTERNAL_ID_RE = /^\d{1,10}$/;

function validateInternalId(req, res, next) {
  const id = (req.params.id || '').trim();
  if (!INTERNAL_ID_RE.test(id)) {
    return respondError(
      res,
      400,
      `Invalid title ID "${id}". Expected a numeric ID (e.g. 42).`
    );
  }
  next();
}

module.exports = {
  validateImdbId,
  validateTmdbId,
  validateSlug,
  validateInternalId,
};
