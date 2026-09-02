/**
 * Pre-launch hardening verification script.
 * Tests: input validation, rate limiter, CORS header absence, error response shape.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// ── 1. Validate-params unit test (no server needed) ───────────────────────────
const { validateImdbId, validateTmdbId, validateSlug, validateInternalId } = require('../src/middleware/validate-params');

let passed = 0;
let failed = 0;

function fakeRes(expectedStatus) {
  let captured = null;
  const headers = {};
  const r = {
    status(code) { captured = { code, body: null }; return this; },
    set(obj) { Object.assign(headers, obj); return this; },
    setHeader(k, v) { headers[k] = v; return this; },
    send(body) { captured.body = JSON.parse(body); return this; },
    getCapture: () => captured,
    getHeaders: () => headers,
  };
  return r;
}
function fakeReq(params) { return { params, headers: {}, socket: {} }; }
function fakeNext() { let called = false; return { fn: () => { called = true; }, wasCalled: () => called }; }

function test(label, middleware, params, expectPass) {
  const req = fakeReq(params);
  const res = fakeRes();
  const next = fakeNext();
  middleware(req, res, next.fn);

  const captured = res.getCapture();
  const ok = expectPass
    ? (next.wasCalled() && !captured)
    : (!next.wasCalled() && captured?.code === 400 && captured?.body?.success === false);

  if (ok) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.log(`  ❌  ${label}  — next=${next.wasCalled()} status=${captured?.code} body=${JSON.stringify(captured?.body)}`);
    failed++;
  }
}

console.log('\n── Input Validation ─────────────────────────────────────────');
// IMDb
test('IMDb: valid tt21192188',              validateImdbId, { imdb_id: 'tt21192188' },         true);
test("IMDb: reject 'NOTANID'",             validateImdbId, { imdb_id: 'NOTANID' },             false);
test("IMDb: reject SQL injection",         validateImdbId, { imdb_id: "'; DROP TABLE--" },     false);
test("IMDb: reject path traversal",        validateImdbId, { imdb_id: '../../etc/passwd' },    false);
test('IMDb: reject too-short tt123',       validateImdbId, { imdb_id: 'tt123' },               false);
// TMDB
test('TMDB: valid 993710',                 validateTmdbId, { tmdb_id: '993710' },              true);
test("TMDB: reject letters",              validateTmdbId, { tmdb_id: 'abc' },                 false);
test("TMDB: reject path traversal",       validateTmdbId, { tmdb_id: '../../etc/passwd' },    false);
// Slug — normalizes to lowercase, so uppercase input is accepted (then lowercased)
test('Slug: valid back-in-action-2025',    validateSlug,   { slug: 'back-in-action-2025' },   true);
test("Slug: accept uppercase (normalized)",validateSlug,   { slug: 'Back-In-Action-2025' },   true); // lowercase internally
test("Slug: reject path traversal",        validateSlug,   { slug: '../../etc/passwd' },       false);
test("Slug: reject with spaces",           validateSlug,   { slug: 'back in action' },         false);
test("Slug: reject SQL injection",         validateSlug,   { slug: "'; DROP TABLE" },          false);
// Internal ID
test('InternalId: valid 42',              validateInternalId, { id: '42' },                   true);
test("InternalId: reject letters",        validateInternalId, { id: 'abc' },                  false);
test("InternalId: reject st-1 prefix",   validateInternalId, { id: 'st-1' },                  false);

// ── 2. Rate limiter test ──────────────────────────────────────────────────────
console.log('\n── Rate Limiter ─────────────────────────────────────────────');
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.RATE_LIMIT_REQUESTS_PER_MIN = '3';

const { rateLimit } = require('../src/middleware/rate-limit');

let rateLimitHit = false;
const fakeIp = '10.0.0.99';

for (let i = 1; i <= 6; i++) {
  const res = fakeRes();
  const next = fakeNext();
  rateLimit(fakeReq({ 'x-forwarded-for': fakeIp }), res, next.fn);
  const capture = res.getCapture();

  if (capture && capture.code === 429) {
    if (!rateLimitHit) {
      rateLimitHit = true;
      console.log(`  ✅  429 triggered on request #${i} (limit=3)`);
      console.log(`      Retry-After header: ${res.getHeaders()['Retry-After']}s`);
      console.log(`      X-RateLimit-Remaining: ${res.getHeaders()['X-RateLimit-Remaining']}`);
      console.log(`      error body: "${capture.body.error}"`);
      passed++;
    }
  }
}
if (!rateLimitHit) {
  console.log('  ❌  Rate limiter did not trigger after 6 requests (limit=3)');
  failed++;
}

// ── 3. Allowed requests get X-RateLimit headers ───────────────────────────────
process.env.RATE_LIMIT_REQUESTS_PER_MIN = '100';
const res2 = fakeRes();
const next2 = fakeNext();
rateLimit(fakeReq({}), res2, next2.fn);
const rlHeaders = res2.getHeaders();
if (rlHeaders['X-RateLimit-Limit'] === '100' && next2.wasCalled()) {
  console.log(`  ✅  Allowed request has X-RateLimit-Limit: ${rlHeaders['X-RateLimit-Limit']}, X-RateLimit-Remaining: ${rlHeaders['X-RateLimit-Remaining']}`);
  passed++;
} else {
  console.log('  ❌  X-RateLimit headers missing or next() not called');
  failed++;
}

// ── 4. CORS header absence ────────────────────────────────────────────────────
console.log('\n── CORS Headers ─────────────────────────────────────────────');
const { respond, respondError } = require('../src/response');
const corsCheckRes = fakeRes();
respond(corsCheckRes, 200, { test: true });
const responseHeaders = corsCheckRes.getHeaders();

const hasCors = 'Access-Control-Allow-Origin' in responseHeaders;
if (!hasCors) {
  console.log('  ✅  Access-Control-Allow-Origin absent from API responses');
  passed++;
} else {
  console.log('  ❌  Access-Control-Allow-Origin still present:', responseHeaders['Access-Control-Allow-Origin']);
  failed++;
}

// ── 5. Error shape check ──────────────────────────────────────────────────────
console.log('\n── Error Response Shape ─────────────────────────────────────');
const errRes = fakeRes();
respondError(errRes, 400, 'Test error message');
const capture = errRes.getCapture();
const shapeOk = capture?.body?.success === false && typeof capture?.body?.error === 'string' && capture?.body?.provider === 'CNF1G';

if (shapeOk) {
  console.log('  ✅  { success: false, error: "...", provider: "CNF1G" }');
  passed++;
} else {
  console.log('  ❌  Shape wrong:', JSON.stringify(capture?.body));
  failed++;
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(55)}`);
console.log(`  Total: ${passed + failed}  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);
if (failed > 0) process.exit(1);
else { console.log('\n  🎉  All checks passed — ready for launch.\n'); process.exit(0); }
