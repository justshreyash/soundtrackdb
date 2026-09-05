require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../src/index');
const singleflight = require('../src/services/singleflight');
const metrics = require('../src/services/metrics');
const { ErrorCodes } = require('../src/errors');

describe('SoundTrackDB Observability & Reliability Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('1. Request Context & Response Headers', () => {
    it('should set X-Request-ID, X-API-Version, X-Response-Time and X-Cache headers', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);

      const reqId = res.headers.get('x-request-id');
      assert.ok(reqId, 'X-Request-ID header must be present');
      assert.ok(reqId.startsWith('req_'), 'X-Request-ID should start with req_');

      const apiVer = res.headers.get('x-api-version');
      assert.equal(apiVer, '1.0.0');

      const respTime = res.headers.get('x-response-time');
      assert.ok(respTime, 'X-Response-Time must be present');
      assert.ok(respTime.endsWith('ms'), 'X-Response-Time should end with ms');

      const cacheHdr = res.headers.get('x-cache');
      assert.ok(cacheHdr === 'HIT' || cacheHdr === 'MISS', 'X-Cache should be HIT or MISS');
    });

    it('should preserve incoming X-Request-ID header', async () => {
      const customId = 'req_custom_trace_12345';
      const res = await fetch(`${baseUrl}/health`, {
        headers: { 'X-Request-ID': customId },
      });
      assert.equal(res.headers.get('x-request-id'), customId);
    });
  });

  describe('2. Health Probes & Versioning', () => {
    it('GET /health should return 200 ok with uptime', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.status, 'ok');
      assert.ok(typeof data.uptime_seconds === 'number');
    });

    it('GET /api/health backward-compatibility alias should return 200', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.status, 'ok');
    });

    it('GET /health/db should verify database connectivity and return latency', async () => {
      const res = await fetch(`${baseUrl}/health/db`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.database, 'reachable');
      assert.ok(typeof data.latency_ms === 'number');
    });

    it('GET /version should return semantic version and environment', async () => {
      const res = await fetch(`${baseUrl}/version`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.version);
      assert.ok(data.environment);
      assert.ok(data.git_commit);
    });
  });

  describe('3. OpenAPI & Documentation Routes', () => {
    it('GET /openapi.json should return valid OpenAPI 3.0 document', async () => {
      const res = await fetch(`${baseUrl}/openapi.json`);
      assert.equal(res.status, 200);
      const spec = await res.json();
      assert.equal(spec.openapi, '3.0.3');
      assert.ok(spec.paths['/v1/titles/imdb/{imdb_id}/music']);
      assert.ok(spec.components.schemas.TitleSoundtrackResponse);
    });

    it('GET /docs should serve Scalar interactive documentation HTML', async () => {
      const res = await fetch(`${baseUrl}/docs`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes('@scalar/api-reference'));
      assert.ok(html.includes('/openapi.json'));
    });
  });

  describe('4. Standardized Error Contracts & Backward Compatibility', () => {
    it('should return error string AND structured error_code + request_id on 400', async () => {
      const res = await fetch(`${baseUrl}/v1/titles/imdb/invalid_id/music`);
      assert.equal(res.status, 400);
      const data = await res.json();

      // Backward compatibility: data.error is a string
      assert.equal(data.success, false);
      assert.ok(typeof data.error === 'string', 'error property must remain a string');
      assert.ok(data.error.includes('Invalid IMDb ID'));

      // New structured extensions
      assert.equal(data.error_code, ErrorCodes.INVALID_IMDB_ID);
      assert.ok(data.request_id);
      assert.ok(data.error_details);
      assert.equal(data.error_details.code, ErrorCodes.INVALID_IMDB_ID);
    });

    it('should return TITLE_NOT_FOUND error code on 404', async () => {
      const res = await fetch(`${baseUrl}/v1/titles/imdb/tt99999999/music`);
      assert.equal(res.status, 404);
      const data = await res.json();

      assert.equal(data.success, false);
      assert.ok(typeof data.error === 'string');
      assert.equal(data.error_code, ErrorCodes.TITLE_NOT_FOUND);
      assert.ok(data.request_id);
    });
  });

  describe('5. SingleFlight Concurrency Protection', () => {
    it('should deduplicate multiple simultaneous calls for the same key into one execution', async () => {
      let callCount = 0;
      const worker = async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 60));
        return { value: 42 };
      };

      // Fire 10 simultaneous calls for the same key
      const key = 'test-concurrent-key';
      const results = await Promise.all([
        singleflight.do(key, worker),
        singleflight.do(key, worker),
        singleflight.do(key, worker),
        singleflight.do(key, worker),
        singleflight.do(key, worker),
      ]);

      assert.equal(callCount, 1, 'Worker should only execute exactly ONCE across all 5 concurrent calls');
      for (const r of results) {
        assert.equal(r.value, 42);
      }
    });
  });

  describe('6. Metrics Engine & Percentiles', () => {
    it('should record requests and compute p50, p95, p99 accurately', async () => {
      metrics.reset();

      // Record simulated response times: 10ms, 20ms, ... 100ms
      for (let i = 1; i <= 100; i++) {
        metrics.recordRequest({
          route: '/test',
          statusCode: 200,
          durationMs: i * 10,
          cacheHit: i <= 80,
          externalFetch: i > 80,
          externalFetchMs: i > 80 ? i * 20 : null,
        });
      }

      const m = metrics.getMetrics();
      assert.equal(m.total_requests, 100);
      assert.equal(m.status_distribution['2xx'], 100);
      assert.equal(m.data_resolution.cache_hits, 80);
      assert.equal(m.data_resolution.cache_hit_rate_pct, 80.0);
      assert.equal(m.data_resolution.fresh_fetches, 20);

      // Total latency: p50 should be ~500ms, p95 should be ~950ms, p99 should be ~990ms
      assert.ok(m.latency.total.p50 >= 490 && m.latency.total.p50 <= 520, `p50=${m.latency.total.p50}`);
      assert.ok(m.latency.total.p95 >= 940 && m.latency.total.p95 <= 960, `p95=${m.latency.total.p95}`);
      assert.ok(m.latency.total.p99 >= 980 && m.latency.total.p99 <= 1000, `p99=${m.latency.total.p99}`);
    });

    it('GET /api/metrics should return aggregated telemetry payload', async () => {
      const res = await fetch(`${baseUrl}/api/metrics`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.latency);
      assert.ok(data.data_resolution);
      assert.ok(typeof data.total_requests === 'number');
    });

    it('GET /api/status-feed should return operational status of services', async () => {
      const res = await fetch(`${baseUrl}/api/status-feed`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.services.api.status, 'operational');
      assert.ok(data.services.database.status);
      assert.ok(data.services.data_resolution.status);
      assert.ok(data.metrics_summary);
    });
  });

  describe('7. Vercel Serverless Function & Rewrite Compatibility', () => {
    it('should normalize rewritten Vercel URLs via x-matched-path header', async () => {
      // Simulate Vercel rewrite sending /api/index.js with original path in x-matched-path
      const res = await fetch(`${baseUrl}/api/index.js`, {
        headers: {
          'x-matched-path': '/api/status-feed',
        },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.services.api.status, 'operational');
    });

    it('should serve favicon.svg statically with image/svg+xml content type', async () => {
      const res = await fetch(`${baseUrl}/favicon.svg`);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('image/svg+xml'));
    });
  });
});

