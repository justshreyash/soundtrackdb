# Sportify API

> **Free, unlimited Spotify music data API. No API key, no OAuth, no sign-up required.**

**Live API:** 

---

## What Is This?

Sportify API is a free public REST API that gives developers instant access to Spotify music catalogue data — tracks, albums, artists, playlists and search — without needing a Spotify developer account, API key, or OAuth flow.

It works by combining three data sources, falling through them in order until a result is found:

1. **Spotify Embed Scraping** — parses the open embed pages which are publicly accessible and carry full metadata including thumbnails, track lists, and preview URLs
2. **Spotify Partner GraphQL** — calls the internal Spotify GraphQL API using a TOTP-generated web-player token, used for search and richer playlist data (followers, owner info)
3. **MusicBrainz + Wikidata fallback** — for artist and album lookups, queries the MusicBrainz URL API and Wikidata SPARQL (properties P1902 for artists, P1729 for albums) to resolve IDs when direct embeds are unavailable

Built and maintained by **cnf1g** under the **CNF1G** umbrella.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check and uptime status |
| GET | `/api/token` | Current Spotify web-player access token |
| GET | `/api/search` | Search tracks, albums, artists, playlists |
| GET | `/api/track/:id` | Full track metadata by Spotify ID |
| GET | `/api/album/:id` | Album details with complete track listing |
| GET | `/api/playlist/:id` | Playlist info, owner, followers and all tracks |
| GET | `/api/artist/:id` | Artist profile, genres and metadata |
| GET | `/api/artist/:id/top-tracks` | Artist top tracks |

---

## Quick Start

No setup, no keys. Call the API directly:

```bash
# Search for a track
curl "https://sportify.xcasper.space/api/search?q=Faded&type=track&limit=5"

# Get a track by Spotify ID
curl "https://sportify.xcasper.space/api/track/3n3Ppam7vgaVa1iaRUIOKE"

# Get album details (After Hours - The Weeknd)
curl "https://sportify.xcasper.space/api/album/4yP0hdKOZPNshxUOjY0cZj"

# Get artist profile (Alan Walker)
curl "https://sportify.xcasper.space/api/artist/7vk5e3vY1uw9plTHJAMwjN"

# Get artist top tracks
curl "https://sportify.xcasper.space/api/artist/7vk5e3vY1uw9plTHJAMwjN/top-tracks"

# Get a playlist (RapCaviar)
curl "https://sportify.xcasper.space/api/playlist/37i9dQZF1DX0XUsuxWHRQd"
```

---

## 🎬 Movie Soundtrack API (v1)

Resolve movie & TV titles to verified Spotify soundtrack playlists via IMDb ID, TMDB ID, canonical slug, or internal ID.

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/v1/titles/imdb/:imdb_id/music` | GET | Resolve soundtrack playlist by IMDb ID (e.g. `tt13070038`) |
| `/v1/titles/tmdb/:tmdb_id/music` | GET | Resolve soundtrack playlist by TMDB ID (e.g. `766507`) |
| `/v1/titles/slug/:slug/music` | GET | Resolve soundtrack playlist by slug (e.g. `apex-2026`) |
| `/v1/titles/:id/music` | GET | Resolve soundtrack playlist by internal ID (e.g. `1`) |
| `/v1/titles` | GET | List / search cataloged titles (`?q=`, `?year=`, `?limit=`) |
| `/v1/titles/:id/music` | PUT | Manually override/set correct Spotify playlist or album |
| `/v1/titles/:id/music` | DELETE | Unlink/remove bad soundtrack mapping |
| `/v1/titles/ingest` | POST | Ingest/update title with automatic Spotify playlist validation |

> **Tip:** Add `?force=true` to any `GET .../music` endpoint to force re-evaluating Spotify search and updating the cached playlist.

### Example Request

```bash
# Resolve by IMDb ID
curl "http://localhost:3000/v1/titles/imdb/tt13070038/music"

# Resolve by Slug
curl "http://localhost:3000/v1/titles/slug/apex-2026/music"

# Resolve by TMDB ID
curl "http://localhost:3000/v1/titles/tmdb/993710/music"
```

### Example Response

```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": true,
  "title": {
    "id": "2",
    "name": "Back in Action",
    "year": 2025,
    "type": "movie",
    "imdb_id": "tt21192188",
    "tmdb_id": "993710",
    "slug": "back-in-action-2025"
  },
  "music": [
    {
      "id": "st-2",
      "platform": "spotify",
      "type": "playlist",
      "playlist_id": "4ELkRqKThShCLqkkQ1xRY0",
      "url": "https://open.spotify.com/playlist/4ELkRqKThShCLqkkQ1xRY0",
      "source": "community",
      "verified": true,
      "confidence": 0.8,
      "match_type": "exact"
    }
  ]
}
```

### Response fields — `music[]`

| Field | Type | Description |
|---|---|---|
| `confidence` | float 0.0–1.0 | **1.0** official+verified · **0.8** community+verified · **0.6** official+unverified · **0.4** community+unverified |
| `match_type` | `"exact"` \| `"agnostic"` | **exact** = resolved via IMDb/TMDB ID · **agnostic** = resolved via title+year text match only (lower confidence) |
| `verified` | boolean | `true` = manually confirmed or official Spotify source |
| `source` | `"official"` \| `"community"` | `official` = from Spotify/label · `community` = curated by third party |

> **Tip:** filter on `confidence >= 0.8` and `match_type == "exact"` for the highest-quality results.

If a title exists but has no soundtrack playlists linked:

```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": true,
  "title": {
    "id": "1842",
    "name": "Apex",
    "year": 2026
  },
  "music": []
}
```

---

## Search Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query |
| `type` | string | Yes | - | `track`, `album`, `artist`, `playlist` |
| `limit` | number | No | 10 | Results count (max 50) |
| `offset` | number | No | 0 | Pagination offset |

---

## Response Format

All endpoints return a consistent envelope:

```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": true,
  "track": { ... }
}
```

Error responses:

```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": false,
  "error": "Description of what went wrong"
}
```

---

## Using the Token

The `/api/token` endpoint returns an anonymous Spotify web-player access token generated internally via a TOTP mechanism — the same method the Spotify web player uses. The token is automatically refreshed every 30 minutes.

### Token response shape

```json
{
  "provider": "CNF1G",
  "creator": "shreyash",
  "success": true,
  "token": "BQD3v7...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

| Field | Description |
|-------|-------------|
| `token` | The Bearer access token string |
| `expiresIn` | Seconds until expiry (typically 3600 = 1 hour) |
| `tokenType` | Always `"Bearer"` |

### Calling Spotify's API directly with this token

Once you have the token you can call any of Spotify's public `/v1` endpoints yourself — no developer account or app registration needed.

**bash / curl**

```bash
# Step 1: grab the token
TOKEN=$(curl -s https://sportify.xcasper.space/api/token \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Step 2: use it with Spotify's API
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.spotify.com/v1/search?q=Faded&type=track&limit=5"

curl -H "Authorization: Bearer $TOKEN" \
  "https://api.spotify.com/v1/tracks/3n3Ppam7vgaVa1iaRUIOKE"

curl -H "Authorization: Bearer $TOKEN" \
  "https://api.spotify.com/v1/artists/7vk5e3vY1uw9plTHJAMwjN"

curl -H "Authorization: Bearer $TOKEN" \
  "https://api.spotify.com/v1/albums/4yP0hdKOZPNshxUOjY0cZj"
```

**JavaScript (fetch)**

```js
async function getToken() {
  const res = await fetch('https://sportify.xcasper.space/api/token');
  const data = await res.json();
  return data.token;
}

async function searchSpotify(query) {
  const token = await getToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}
```

**Python**

```python
import requests

def get_token():
    r = requests.get('https://sportify.xcasper.space/api/token')
    return r.json()['token']

def search_spotify(query):
    token = get_token()
    r = requests.get(
        'https://api.spotify.com/v1/search',
        params={'q': query, 'type': 'track', 'limit': 10},
        headers={'Authorization': f'Bearer {token}'}
    )
    return r.json()
```

### Token caching

The token is valid for ~1 hour. Cache it and only re-fetch when it expires to avoid unnecessary requests:

```js
let _token = null;
let _expiresAt = 0;

async function getToken() {
  if (_token && Date.now() < _expiresAt) return _token;
  const res = await fetch('https://sportify.xcasper.space/api/token');
  const { token, expiresIn } = await res.json();
  _token = token;
  _expiresAt = Date.now() + (expiresIn - 60) * 1000; // refresh 60s before expiry
  return _token;
}
```

---

## Self-Hosting

### Requirements

- Node.js 18+
- npm 8+

### Environment Variables

Create a `.env` file (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `NODE_ENV` | `development` | Set to `production` on host — controls error detail in logs |
| `REFRESH_INTERVAL_MINUTES` | `30` | Token auto-refresh interval |
| `TURSO_DATABASE_URL` | *(local SQLite)* | Turso cloud DB URL — leave blank to use local `data/soundtracks.db` |
| `TURSO_AUTH_TOKEN` | - | Turso auth token |
| `TMDB_API_KEY` | - | Optional — TMDB API key for higher rate limits |
| `RATE_LIMIT_ENABLED` | `false` | Set `true` in production to enforce IP rate limits |
| `RATE_LIMIT_REQUESTS_PER_MIN` | `60` | Max requests per IP per 60s window |
| `CRON_SECRET` | - | Bearer secret to protect `GET /api/cron-health-check` |
| `GITHUB_TOKEN` | - | Optional: persist token across restarts |
| `GITHUB_REPO` | - | Optional: repo for token storage (e.g. `user/repo`) |

### Run Locally

```bash
git clone https://github.com/Casper-Tech-ke/sportify-api.git
cd sportify-api
npm install
npm start
```

### Deploy with PM2

```bash
npm install -g pm2
pm2 start src/index.js --name sportify-api
pm2 save
pm2 startup
```

---

## Project Structure

```
sptfy-api/
├── api/
│   └── cron-health-check.js  - Vercel Cron function (weekly playlist health check)
├── src/
│   ├── index.js              - Express server entry point and route registration
│   ├── token-manager.js      - Token cache, TOTP auth and refresh scheduler
│   ├── totp.js               - Spotify TOTP token generation
│   ├── spotify-graphql.js    - Shared embed scraping and partner GraphQL helpers
│   ├── rate-limit-state.js   - Per-strategy backoff and rate-limit tracking
│   ├── github.js             - GitHub token persistence (optional)
│   ├── response.js           - Standardised response helpers
│   ├── crypto.js             - Crypto utilities
│   ├── middleware/
│   │   ├── rate-limit.js     - Sliding-window IP rate limiter
│   │   └── validate-params.js - Route param validators (IMDb/TMDB/slug/ID)
│   ├── routes/
│   │   ├── track.js          - GET /api/track/:id
│   │   ├── album.js          - GET /api/album/:id
│   │   ├── artist.js         - GET /api/artist/:id and /top-tracks
│   │   ├── playlist.js       - GET /api/playlist/:id
│   │   ├── search.js         - GET /api/search
│   │   └── v1-titles.js      - All /v1/titles/* soundtrack routes
│   └── services/
│       ├── soundtrack-db.js      - Turso DB layer (resolveOrCreateTitle, alias, confidence)
│       ├── soundtrack-resolver.js - Auto-ingest pipeline (TMDB → Spotify)
│       ├── soundtrack-finder.js  - Spotify playlist search + scoring
│       ├── soundtrack-validator.js - Playlist ID extraction and validation
│       └── tmdb.js               - TMDB metadata fetching
├── scripts/
│   ├── rebuild-schema.js     - DROP + CREATE all tables (run before reseed)
│   ├── migrate-to-turso.js   - Reseed from data/titles.json + soundtracks.json
│   ├── checkSoundtrackHealth.js - Manual playlist health check (--dry-run supported)
│   ├── ingest-by-tmdb.js     - Ingest single title by TMDB ID
│   └── refresh.js            - Manual token refresh
├── public/
│   ├── index.html            - Interactive API documentation page
│   ├── favicon.svg
│   └── og.png
├── vercel.json               - Vercel Cron schedule config
├── .env.example
├── SECURITY.md
└── README.md
```



