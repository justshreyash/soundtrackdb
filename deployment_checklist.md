# SoundtrackDB / Sportify API — Production Deployment Checklist

This document contains step-by-step instructions for deploying your API to production on **Vercel** with **Turso (libSQL)**.

---

## 1. Turso Cloud Database Setup

If you haven't already provisioned a Turso database for production:

1. **Create Turso Database**:
   ```bash
   turso db create soundtrackdb-prod
   ```

2. **Retrieve Connection Details**:
   ```bash
   turso db show soundtrackdb-prod --url
   # Copy URL (libsql://soundtrackdb-prod-xxxx.turso.io)

   turso db tokens create soundtrackdb-prod
   # Copy Auth Token
   ```

3. **Initialize Schema & Seed Data on Turso**:
   Set environment variables locally in terminal and run the rebuild + reseed scripts against Turso:
   ```bash
   $env:TURSO_DATABASE_URL="libsql://soundtrackdb-prod-xxxx.turso.io"
   $env:TURSO_AUTH_TOKEN="your-turso-token"

   # Drop and recreate production tables
   node scripts/rebuild-schema.js

   # Reseed catalog from JSON files into Turso
   node scripts/migrate-to-turso.js
   ```

---

## 2. Environment Variables Checklist (Vercel)

Go to **Vercel Dashboard → Project Settings → Environment Variables** and configure the following:

| Environment Variable | Value / Description | Required? |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://soundtrackdb-prod-xxxx.turso.io` | **Yes** |
| `TURSO_AUTH_TOKEN` | Your Turso database auth token | **Yes** |
| `TMDB_API_KEY` | Your TMDB v3 API Key (used for sub-second IMDb/TMDB lookups) | **Yes** |
| `RATE_LIMIT_ENABLED` | `true` | **Yes** (enables rate limiter in production) |
| `RATE_LIMIT_REQUESTS_PER_MIN` | `10` *(or desired threshold e.g. 10)* | **Yes** |
| `NODE_ENV` | `production` | **Yes** (hides internal stack traces) |
| `CRON_SECRET` | Generate random secret string (e.g. `openssl rand -hex 32`) | **Yes** (secures health check cron) |

---

## 3. Vercel Deployment Steps

1. **Deploy to Vercel**:
   Push to GitHub (if connected to Vercel) or run via Vercel CLI:
   ```bash
   vercel --prod
   ```

2. **Verify Deployment & Crons**:
   - Check **Vercel Dashboard → Settings → Crons** to confirm `/api/cron-health-check` is scheduled weekly (`0 2 * * 0`).
   - Test health endpoint: `GET https://your-domain.vercel.app/api/health`

---

## 4. Post-Launch Monitoring (5 Minutes)

1. **UptimeRobot (Free Monitoring)**:
   - Create a free account at [uptimerobot.com](https://uptimerobot.com).
   - Add new monitor: **HTTP(s)**.
   - URL: `https://your-domain.vercel.app/api/health`.
   - Monitoring Interval: **5 minutes**.
   - Notifications: Set your email / Telegram alert.

2. **Vercel Function Error Alerts**:
   - Go to **Vercel Dashboard → Settings → Notifications**.
   - Enable **Function Errors** email notifications.

---

## 5. Summary of New API Capabilities Live in Code

- **Community Moderation**: Users can flag bad soundtrack mappings via `POST /v1/titles/:id/music/:soundtrack_id/report`. Reaching 5 reports automatically deactivates (`is_active = 0`) the soundtrack.
- **Alias Conflict Protection**: Duplicate slugs mapped to different titles log structured `[Alias Conflict]` warnings instead of silently ignoring or corrupting mappings.
- **Fast IMDb Resolution**: IMDb lookup queries TMDB `/3/find/{imdb_id}` first before falling back to Wikidata SPARQL, preventing 404s from Wikidata timeouts.
