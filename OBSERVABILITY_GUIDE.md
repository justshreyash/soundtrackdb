# SoundTrackDB — Observability, Reliability & Manual Testing Guide

This guide documents the production observability architecture, how to access all dashboards, how to answer every key question from `mustToHave.txt`, and practical commands to test everything manually.

---

## Table of Contents

1. [Windows PowerShell Tip (`curl` vs `curl.exe`)](#windows-powershell-tip-curl-vs-curlexe)
2. [Accessing the 3 Dashboards](#accessing-the-3-dashboards)
3. [Answering the Core Questions from `mustToHave.txt`](#answering-the-core-questions-from-musttohavetxt)
   - [Q1: Instant DB Hits vs 3–7s On-Demand Fetches](#q1-instant-db-hits-vs-37s-on-demand-fetches)
   - [Q2: Investigating "Why did this movie take 4s?" via Request ID](#q2-investigating-why-did-this-movie-take-4s-via-request-id)
   - [Q3: Tracking Latency Percentiles (p50, p95, p99)](#q3-tracking-latency-percentiles-p50-p95-p99)
   - [Q4: Health Checks Without Expensive External Calls](#q4-health-checks-without-expensive-external-calls)
   - [Q5: Concurrency Protection (SingleFlight)](#q5-concurrency-protection-singleflight)
   - [Q6: Backward-Compatible Error Categorization](#q6-backward-compatible-error-categorization)
4. [Step-by-Step Manual Testing Cheatsheet](#step-by-step-manual-testing-cheatsheet)
5. [Summary of Endpoints & Response Headers](#summary-of-endpoints--response-headers)

---

## Windows PowerShell Tip (`curl` vs `curl.exe`)

> [!IMPORTANT]
> In Windows PowerShell, typing `curl` invokes the PowerShell alias `Invoke-WebRequest`. Running `curl -i` causes PowerShell to prompt for `Uri:`.
>
> **Always use `curl.exe` in Windows PowerShell:**
> ```powershell
> # In Windows PowerShell:
> curl.exe -i "http://localhost:3000/v1/titles/imdb/tt13070038/music"
> ```

---

## Accessing the 3 Dashboards

| Dashboard | URL | Purpose |
|---|---|---|
| **1. Visual Service Dashboard** | [`http://localhost:3000/#status-panel`](http://localhost:3000/#status-panel) | Real-time card on the homepage. Displays Core REST API status, Turso LibSQL ping latency, Cache Hit %, total requests, and p50/p95/p99 latency. |
| **2. Interactive API Reference (Docs)** | [`http://localhost:3000/docs`](http://localhost:3000/docs) | Powered by Scalar OpenAPI 3.0. Lets you view schemas, parameters, and click **"Test Request"** directly in your browser. |
| **3. Telemetry Stream (JSON)** | [`http://localhost:3000/api/metrics`](http://localhost:3000/api/metrics) | High-speed JSON feed for monitoring scripts, status aggregators, or CLI inspection. |

---

## Answering the Core Questions from `mustToHave.txt`

### Q1: Instant DB Hits vs 3–7s On-Demand Fetches
> *"We had 10,000 requests this week. How many were instant database hits and how many triggered a 3–7 second acquisition?"* (Sections 1 & 12)

#### How to Answer:
Query `GET /api/metrics` and inspect the `data_resolution` block:

```bash
curl.exe -s http://localhost:3000/api/metrics
```

Example JSON response:
```json
{
  "data_resolution": {
    "cache_hits": 15810,
    "cache_hit_rate_pct": 85.8,
    "fresh_fetches": 2420,
    "fresh_fetch_rate_pct": 13.1,
    "fresh_fetch_failures": 190,
    "fresh_fetch_success_rate_pct": 92.1,
    "fresh_fetch_latency": {
      "p50": 2840,
      "p95": 3910,
      "p99": 4150
    }
  }
}
```

- **Instant DB Hits:** `cache_hits` (15,810 requests) and `cache_hit_rate_pct` (85.8%).
- **On-Demand Fetches:** `fresh_fetches` (2,420 requests) and `fresh_fetch_rate_pct` (13.1%).
- **On-Demand Latency:** `fresh_fetch_latency.p95` (3.91s) gives you the exact performance of the fresh resolution path without mixing it with sub-10ms DB hits.

---

### Q2: Investigating "Why did this movie take 4s?" via Request ID
> *"Every request gets something like: request_id: req_8f31c2... Now if someone says 'This movie took 4 seconds', you can actually investigate that request."* (Section 2)

#### How to Answer:
1. When a client or developer reports a slow query, they provide the `X-Request-ID` returned in the response header (e.g. `req_4c03e634d270`).
2. Run the request to inspect headers:
   ```bash
   curl.exe -i "http://localhost:3000/v1/titles/imdb/tt13070038/music"
   ```
   Headers returned:
   ```http
   HTTP/1.1 200 OK
   X-Request-ID: req_4c03e634d270
   X-API-Version: 1.0.0
   X-Response-Time: 18.4ms
   X-Cache: HIT
   ```
3. Look up that Request ID in your terminal or Vercel Runtime Logs:
   ```json
   {
     "timestamp": "2026-09-05T13:40:16.216Z",
     "level": "info",
     "message": "Request completed",
     "request_id": "req_4c03e634d270",
     "route": "/v1/titles/imdb/:imdb_id/music",
     "method": "GET",
     "status": 200,
     "duration_ms": 3840,
     "cache_hit": false,
     "external_fetch": true,
     "external_fetch_ms": 3720,
     "outcome": "SUCCESS_FRESH"
   }
   ```
   **Instant diagnosis:** You see `cache_hit: false` and `external_fetch_ms: 3720ms`—meaning the 4 seconds was spent querying TMDB/Spotify for a brand-new title, not a database bottleneck.

#### Where Are Logs Stored & How to View Them?

##### Option A: In Production on Vercel
1. Open your browser and go to **[vercel.com/dashboard](https://vercel.com/dashboard)**.
2. Click on your project: **`soundtrackdb`**.
3. In the top navigation bar, click on **Logs** (or **Observability** → **Runtime Logs**).
4. You will see a live stream of structured JSON log entries.
5. In the **Search / Filter bar** at the top:
   - Paste the Request ID: `req_4c03e634d270`
   - Or filter by slow requests: `duration_ms:>1000`
   - Or filter by errors: `level:error`
6. Click on any log row. Because our logger outputs structured JSON, Vercel automatically expands and formats every field (`duration_ms`, `cache_hit`, `external_fetch_ms`, `error_code`) into a clean key-value table.

##### Option B: Locally in Development
- When running `npm start` or `npm run dev`, all structured logs print directly to your terminal standard output (`stdout` / `stderr`).

---

### Q3: Tracking Latency Percentiles (p50, p95, p99)
> *"Average = 400ms looks great. But p50 = 90ms, p95 = 2.4s, p99 = 5.8s. Now you know there's a serious long-tail problem."* (Section 11)

#### How to Answer:
Check the `latency` object in `GET /api/metrics` or the Live Service Dashboard:

```json
{
  "latency": {
    "total": {
      "p50": 42,
      "p95": 133,
      "p99": 263,
      "avg": 58,
      "min": 1,
      "max": 3840
    },
    "slow_requests": {
      "gt1s": 2,
      "gt3s": 1,
      "gt5s": 0
    }
  }
}
```

- **p50 (42ms):** 50% of your requests resolve in 42ms or faster.
- **p95 (133ms):** 95% of users experience 133ms or better.
- **p99 (263ms):** The slowest 1% tail latency.
- **slow_requests:** Fast counters for requests taking `>1s`, `>3s`, or `>5s`.

---

### Q4: Health Checks Without Expensive External Calls
> *"Add an actual /health endpoint... Don't make your normal health endpoint perform expensive external API calls."* (Section 5)

#### How to Answer:

1. **Lightweight Liveness Probe (`GET /health`):**
   - Zero DB queries. Pure process health and uptime.
   - Ideal for load balancers and uptime bots pinging every 10 seconds.
   ```bash
   curl.exe -s http://localhost:3000/health
   ```
   ```json
   {
     "provider": "CNF1G",
     "creator": "shreyash",
     "success": true,
     "status": "ok",
     "uptime_seconds": 184
   }
   ```

2. **Deep Database Readiness Probe (`GET /health/db`):**
   - Executes lightweight `SELECT 1;` on Turso.
   - Measures exact network roundtrip latency in milliseconds (`latency_ms`).
   ```bash
   curl.exe -s http://localhost:3000/health/db
   ```
   ```json
   {
     "provider": "CNF1G",
     "creator": "shreyash",
     "success": true,
     "status": "ok",
     "database": "reachable",
     "latency_ms": 38.4
   }
   ```

3. **Version & Build Metadata (`GET /version`):**
   ```bash
   curl.exe -s http://localhost:3000/version
   ```
   ```json
   {
     "version": "1.0.0",
     "environment": "development",
     "git_commit": "a1b2c3d"
   }
   ```

---

### Q5: Concurrency Protection (SingleFlight)
> *"Same unknown title requested -> multiple requests -> multiple external fetches. Protect against with locking/deduplication."* (Section 14)

#### How It Works in SoundTrackDB:
- Handled by [`src/services/singleflight.js`](file:///d:/@1/@2026/allmyAPI/sptfy-api/src/services/singleflight.js).
- When 10 concurrent requests query the same uncataloged IMDb ID (e.g. `tt9999999`):
  - Request 1 initiates the external resolution promise.
  - Requests 2–10 detect the in-flight key and wait on the **exact same Promise**.
  - Exactly **one** TMDB fetch and **one** Turso write occurs.
  - All 10 requests complete with identical data.

---

### Q6: Backward-Compatible Error Categorization
> *"Don't just count 500 = 312. Break it down: INVALID_IMDB_ID, TITLE_NOT_FOUND, RATE_LIMITED... Don't leak internal errors."* (Sections 13 & 16)

#### How to Verify:
Send an invalid IMDb ID format:
```bash
curl.exe -s http://localhost:3000/v1/titles/imdb/bad_id/music
```

Response:
```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": false,
  "error": "Invalid IMDb ID \"bad_id\". Expected format: tt followed by 7–8 digits (e.g. tt21192188).",
  "error_code": "INVALID_IMDB_ID",
  "request_id": "req_a1b2c3d4e5f6",
  "error_details": {
    "code": "INVALID_IMDB_ID",
    "message": "Invalid IMDb ID \"bad_id\"...",
    "request_id": "req_a1b2c3d4e5f6"
  }
}
```

- **Backward compatibility:** Legacy clients that inspect `data.error` as a string work without breaking.
- **Monitoring & Modern Clients:** Can inspect `data.error_code` to categorize errors on status dashboards.
- **Security:** Raw SQLite errors and internal stack traces are never exposed to clients.

---

## Step-by-Step Manual Testing Cheatsheet

Run these commands in PowerShell or Command Prompt to test every part of the system:

```powershell
# 1. Health checks
curl.exe -i "http://localhost:3000/health"
curl.exe -i "http://localhost:3000/health/db"
curl.exe -i "http://localhost:3000/version"

# 2. Inspect Telemetry & Percentile Latencies
curl.exe -s "http://localhost:3000/api/metrics"
curl.exe -s "http://localhost:3000/api/status-feed"

# 3. Resolve a known movie (instant DB cache hit)
curl.exe -i "http://localhost:3000/v1/titles/imdb/tt13070038/music"
# Notice headers: X-Cache: HIT, X-Response-Time: <20ms, X-Request-ID: req_...

# 4. Resolve by slug
curl.exe -i "http://localhost:3000/v1/titles/slug/apex-2026/music"

# 5. Resolve with custom tracing ID passed from client
curl.exe -i -H "X-Request-ID: req_custom_test_999" "http://localhost:3000/v1/titles/imdb/tt13070038/music"
# Notice header: X-Request-ID: req_custom_test_999 is preserved

# 6. Test Client Error (invalid ID validation)
curl.exe -i "http://localhost:3000/v1/titles/imdb/12345/music"
# Returns 400 Bad Request with error_code: INVALID_IMDB_ID

# 7. Test Not Found (non-existent title)
curl.exe -i "http://localhost:3000/v1/titles/imdb/tt99999999/music"
# Returns 404 with error_code: TITLE_NOT_FOUND

# 8. Interactive Documentation & Testing in Browser
# Open in browser: http://localhost:3000/docs
# Open OpenAPI spec: http://localhost:3000/openapi.json
```

---

## Summary of Endpoints & Response Headers

### Response Headers on All Routes
- `X-Request-ID`: Unique traceable request identifier (`req_xxxxxxxxxxxx`).
- `X-API-Version`: Semantic API version (`1.0.0`).
- `X-Response-Time`: Exact total server processing time (`18.4ms`).
- `X-Cache`: `HIT` (served from Turso cache) or `MISS` (served via on-demand fetch).
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`: Rate limit telemetry.

### Core Observability Endpoints
| Endpoint | Method | Response Description |
|---|---|---|
| `/health` | GET | Fast process liveness (no DB queries) |
| `/health/db` | GET | Turso database readiness and latency ping (`latency_ms`) |
| `/version` | GET | Semantic version, environment, Git commit SHA |
| `/api/metrics` | GET | Rolling request count, percentiles (p50/p95/p99), cache hit rate |
| `/api/status-feed` | GET | Aggregated live operational feed for status indicators |
| `/docs` | GET | Interactive Scalar API Reference & testing workbench |
| `/openapi.json` | GET | Full OpenAPI 3.0 specification |
| `/api` | GET | Legacy JSON endpoint summary |
