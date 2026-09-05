/**
 * SoundTrackDB Metrics Engine
 * Lightweight in-memory rolling analytics & percentile calculator.
 * Implements mustToHave.txt sections 1, 10, 11, 12 & 15:
 * - High-speed zero-DB-overhead telemetry (preserves Turso free-tier)
 * - Accurate p50, p95, p99 percentiles via bounded reservoir sampling
 * - Separate tracking for on-demand 3-7s fresh fetch path vs cache hits
 * - Request outcome classification and error categories breakdown
 */

const MAX_RESERVOIR_SAMPLES = 2000;

class MetricsEngine {
  constructor() {
    this.startTime = Date.now();
    this.reset();
  }

  reset() {
    this.totalRequests = 0;
    this.endpoints = new Map(); // endpoint -> count
    this.statusCodes = { '2xx': 0, '4xx': 0, '5xx': 0 };
    this.exactStatuses = new Map(); // 200 -> count, 404 -> count

    // Latency reservoirs
    this.durations = []; // all requests
    this.freshFetchDurations = []; // fresh fetch path only
    this.dbLatencies = []; // db query latencies

    // Slow requests counters
    this.slowRequests = {
      gt1s: 0,
      gt3s: 0,
      gt5s: 0,
    };

    // Data Resolution Breakdown
    this.dataResolution = {
      cacheHits: 0,
      freshFetches: 0,
      fetchFailures: 0,
    };

    // Outcomes
    this.outcomes = {
      SUCCESS_CACHED: 0,
      SUCCESS_FRESH: 0,
      NOT_FOUND: 0,
      INVALID_REQUEST: 0,
      RATE_LIMITED: 0,
      UPSTREAM_FAILURE: 0,
      DATABASE_FAILURE: 0,
      INTERNAL_ERROR: 0,
    };

    // Error categories
    this.errorCategories = new Map();
    this.rateLimitHits = 0;
  }

  _addSample(reservoir, value) {
    if (typeof value !== 'number' || isNaN(value)) return;
    if (reservoir.length < MAX_RESERVOIR_SAMPLES) {
      reservoir.push(value);
    } else {
      // Reservoir sampling (replace random element to maintain fair statistical distribution)
      const randomIndex = Math.floor(Math.random() * (this.totalRequests || MAX_RESERVOIR_SAMPLES));
      if (randomIndex < MAX_RESERVOIR_SAMPLES) {
        reservoir[randomIndex] = value;
      }
    }
  }

  _calculatePercentiles(samples) {
    if (!samples || samples.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    const getP = (p) => {
      const idx = Math.min(Math.floor((p / 100) * n), n - 1);
      return Math.round(sorted[idx]);
    };

    return {
      p50: getP(50),
      p95: getP(95),
      p99: getP(99),
      avg: Math.round(sum / n),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[n - 1]),
    };
  }

  recordRequest({
    route = 'unknown',
    method = 'GET',
    statusCode = 200,
    durationMs = 0,
    cacheHit = false,
    externalFetch = false,
    externalFetchMs = null,
    dbLatencyMs = null,
    outcome = null,
    errorCode = null,
    rateLimited = false,
  }) {
    this.totalRequests++;

    // Endpoint counts
    const epKey = `${method} ${route}`;
    this.endpoints.set(epKey, (this.endpoints.get(epKey) || 0) + 1);

    // Status code breakdown
    const sGroup = statusCode >= 500 ? '5xx' : statusCode >= 400 ? '4xx' : statusCode >= 200 ? '2xx' : 'other';
    if (this.statusCodes[sGroup] !== undefined) {
      this.statusCodes[sGroup]++;
    }
    this.exactStatuses.set(statusCode, (this.exactStatuses.get(statusCode) || 0) + 1);

    // Latency
    this._addSample(this.durations, durationMs);
    if (durationMs > 5000) this.slowRequests.gt5s++;
    else if (durationMs > 3000) this.slowRequests.gt3s++;
    else if (durationMs > 1000) this.slowRequests.gt1s++;

    // Rate limiting
    if (rateLimited || statusCode === 429) {
      this.rateLimitHits++;
    }

    // Cache vs Fresh Fetch
    if (cacheHit) {
      this.dataResolution.cacheHits++;
    } else if (externalFetch) {
      this.dataResolution.freshFetches++;
      if (typeof externalFetchMs === 'number') {
        this._addSample(this.freshFetchDurations, externalFetchMs);
      }
      if (statusCode >= 500 || outcome === 'UPSTREAM_FAILURE') {
        this.dataResolution.fetchFailures++;
      }
    }

    // DB Latency
    if (typeof dbLatencyMs === 'number') {
      this._addSample(this.dbLatencies, dbLatencyMs);
    }

    // Outcome
    if (outcome && this.outcomes[outcome] !== undefined) {
      this.outcomes[outcome]++;
    } else {
      // Derive outcome if not explicitly provided
      if (statusCode === 429) this.outcomes.RATE_LIMITED++;
      else if (statusCode === 404) this.outcomes.NOT_FOUND++;
      else if (statusCode === 400) this.outcomes.INVALID_REQUEST++;
      else if (statusCode >= 500) this.outcomes.INTERNAL_ERROR++;
      else if (cacheHit) this.outcomes.SUCCESS_CACHED++;
      else if (externalFetch) this.outcomes.SUCCESS_FRESH++;
    }

    // Error codes
    if (errorCode) {
      this.errorCategories.set(errorCode, (this.errorCategories.get(errorCode) || 0) + 1);
    }
  }

  getMetrics() {
    const total = this.totalRequests;
    const cacheHits = this.dataResolution.cacheHits;
    const freshFetches = this.dataResolution.freshFetches;
    const totalResolved = cacheHits + freshFetches;

    const cacheHitRate = totalResolved > 0 ? Number(((cacheHits / totalResolved) * 100).toFixed(1)) : 100.0;
    const freshFetchRate = totalResolved > 0 ? Number(((freshFetches / totalResolved) * 100).toFixed(1)) : 0.0;

    const freshFailures = this.dataResolution.fetchFailures;
    const freshSuccessRate = freshFetches > 0 ? Number((((freshFetches - freshFailures) / freshFetches) * 100).toFixed(1)) : 100.0;

    // Convert Maps to plain objects for JSON serialization
    const endpointsObj = {};
    for (const [k, v] of this.endpoints.entries()) {
      endpointsObj[k] = v;
    }

    const statusesObj = {};
    for (const [k, v] of this.exactStatuses.entries()) {
      statusesObj[k] = v;
    }

    const errorsObj = {};
    for (const [k, v] of this.errorCategories.entries()) {
      errorsObj[k] = v;
    }

    return {
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      total_requests: total,
      status_distribution: {
        '2xx': this.statusCodes['2xx'],
        '4xx': this.statusCodes['4xx'],
        '5xx': this.statusCodes['5xx'],
        exact: statusesObj,
      },
      latency: {
        total: this._calculatePercentiles(this.durations),
        slow_requests: this.slowRequests,
      },
      data_resolution: {
        cache_hits: cacheHits,
        cache_hit_rate_pct: cacheHitRate,
        fresh_fetches: freshFetches,
        fresh_fetch_rate_pct: freshFetchRate,
        fresh_fetch_failures: freshFailures,
        fresh_fetch_success_rate_pct: freshSuccessRate,
        fresh_fetch_latency: this._calculatePercentiles(this.freshFetchDurations),
      },
      database_latency: this._calculatePercentiles(this.dbLatencies),
      rate_limiting: {
        rate_limit_hits: this.rateLimitHits,
      },
      outcomes: this.outcomes,
      error_categories: errorsObj,
      endpoints: endpointsObj,
    };
  }
}

const defaultEngine = new MetricsEngine();

module.exports = defaultEngine;
