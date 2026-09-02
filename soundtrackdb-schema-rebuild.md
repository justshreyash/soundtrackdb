# SoundtrackDB — Schema Rebuild & API Correctness Spec

Status: **dev stage, ~50 rows, safe to drop and recreate tables.**
Target: Turso (libSQL/SQLite). No data migration needed — just wipe and reseed from the CSVs already in the repo/DB (or re-run whatever script originally populated `titles`/`soundtracks`).

---

## 1. Problems being fixed

1. **Duplicate title rows for the same movie/show.** Different slug variants (e.g. `love-between-lines` vs `love-between-lines-2026`, `mr-kill` vs `mr-kill-2026`) currently create two separate `titles` rows instead of one canonical title with multiple lookup slugs.
2. **No dedupe check before insert.** Whatever endpoint/job creates a `titles` row on first lookup does not check for an existing match (by `tmdb_id`/`imdb_id` first, then normalized `title`+`year`) before inserting.
3. **No foreign key enforcement.** `soundtracks.title_id` can reference a `titles.id` that doesn't exist or gets deleted later, leaving orphaned rows that no endpoint can ever reach.
4. **No dedupe on soundtracks.** Nothing stops two identical `(title_id, platform, spotify_playlist_id)` rows.
5. **No confidence/staleness signal.** Every soundtrack is treated as equally trustworthy forever, with no way to mark a Spotify playlist as dead/private, and no distinction between an exact ID match vs a fuzzy title match.

---

## 2. New schema (drop + recreate)

```sql
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS soundtracks;
DROP TABLE IF EXISTS title_aliases;
DROP TABLE IF EXISTS titles;

-- ─────────────────────────────────────────────
-- titles: one canonical row per movie/show
-- ─────────────────────────────────────────────
CREATE TABLE titles (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  year        integer,
  type        text DEFAULT 'movie' CHECK (type IN ('movie', 'tv')),
  imdb_id     text UNIQUE,
  tmdb_id     text UNIQUE,
  slug        text UNIQUE NOT NULL,   -- canonical/primary slug
  created_at  numeric DEFAULT CURRENT_TIMESTAMP,
  updated_at  numeric DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_titles_slug  ON titles (slug);
CREATE INDEX idx_titles_tmdb  ON titles (tmdb_id);
CREATE INDEX idx_titles_imdb  ON titles (imdb_id);
CREATE INDEX idx_titles_lookup ON titles (title, year); -- for normalized-name dedupe checks

-- ─────────────────────────────────────────────
-- title_aliases: many slugs -> one title
-- (canonical slug from `titles.slug` should ALSO have a row here)
-- ─────────────────────────────────────────────
CREATE TABLE title_aliases (
  slug        text PRIMARY KEY,
  title_id    text NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  created_at  numeric DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_title_aliases_title ON title_aliases (title_id);

-- ─────────────────────────────────────────────
-- soundtracks: one or more playlists per title
-- ─────────────────────────────────────────────
CREATE TABLE soundtracks (
  id                    text PRIMARY KEY,
  title_id              text NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  platform              text DEFAULT 'spotify',
  type                  text DEFAULT 'playlist',
  spotify_playlist_id   text NOT NULL,
  spotify_url           text NOT NULL,
  source                text DEFAULT 'official' CHECK (source IN ('official', 'community')),
  verified              integer DEFAULT 1,          -- 0/1
  confidence            real DEFAULT 1.0,           -- 0.0–1.0, see table below
  match_type            text DEFAULT 'exact' CHECK (match_type IN ('exact', 'agnostic')),
  is_active             integer DEFAULT 1,          -- flipped to 0 by health-check job
  report_count          integer DEFAULT 0,          -- user "this link is dead/wrong" reports
  last_checked_at       numeric,                    -- last time Spotify API confirmed it's alive
  created_at            numeric DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (title_id, platform, spotify_playlist_id)
);

CREATE INDEX idx_soundtracks_title ON soundtracks (title_id);
CREATE INDEX idx_soundtracks_active ON soundtracks (is_active);
```

### Confidence defaults (set at insert time, not computed on read)

| source    | verified | confidence |
|-----------|----------|------------|
| official  | 1        | 1.0        |
| community | 1        | 0.8        |
| community | 0        | 0.4        |
| official  | 0        | 0.6 *(should be rare — flag for manual review if this happens)* |

`match_type = 'exact'` when the title was resolved via `imdb_id`/`tmdb_id`. `match_type = 'agnostic'` when resolved via fuzzy title/slug text matching only.

---

## 3. Dedupe logic — required before ANY new `titles` insert

Wherever the code currently does "look up title by slug, if not found create it," change to this resolution order:

```
function resolveOrCreateTitle(input: { tmdb_id?, imdb_id?, title, year, type, slug }):
  1. If tmdb_id provided:
       SELECT * FROM titles WHERE tmdb_id = input.tmdb_id
       -> if found, ensure input.slug exists in title_aliases (insert if missing), return title
  2. Else if imdb_id provided:
       SELECT * FROM titles WHERE imdb_id = input.imdb_id
       -> if found, ensure input.slug exists in title_aliases (insert if missing), return title
  3. Else (no external id available — weakest case):
       normalized = lowercase(trim(input.title)) 
       SELECT * FROM titles WHERE lower(title) = normalized AND year = input.year
       -> if found, ensure input.slug exists in title_aliases (insert if missing), return title
       -> mark this title's future soundtrack rows as match_type = 'agnostic'
  4. If nothing found in 1–3: INSERT new titles row, then INSERT its own slug into title_aliases too.
```

Key rule: **a new `titles` row is only ever created after all three lookup strategies fail.** Slug uniqueness alone is not a valid dedupe check — it's exactly what caused the current duplicates, since different slugs for the same movie sail right past `UNIQUE(slug)`.

Also add a `UNIQUE(title_id, platform, spotify_playlist_id)` constraint check (already in schema above) so re-adding the same playlist for a title is a no-op / update, not a duplicate insert.

---

## 4. Endpoint behavior changes

All three lookup endpoints (`/v1/titles/imdb/:id/music`, `/v1/titles/tmdb/:id/music`, `/v1/titles/slug/:slug/music`) should resolve through `title_aliases` for the slug case:

```sql
-- slug lookup now goes through the alias table, not titles.slug directly
SELECT t.* FROM titles t
JOIN title_aliases a ON a.title_id = t.id
WHERE a.slug = :slug;
```

(Keep `titles.slug` as the canonical/display slug used in responses — just don't query it directly for lookups anymore.)

All three endpoints, when fetching soundtracks, should:
- Filter `WHERE is_active = 1` by default.
- Include `confidence`, `match_type`, and `verified` in the response's `music[]` objects (already partially present — just add `confidence` and `match_type`).

`/v1/titles` (list endpoint) — no structural change needed, but music count should count only `is_active = 1` rows.

### Updated response shape example

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

---

## 5. Rate limiting — dev mode

Do **not** hardcode rate limiting logic yet. Instead, scaffold it behind an env flag so it's a one-line flip later:

```
# .env
RATE_LIMIT_ENABLED=false
RATE_LIMIT_REQUESTS_PER_MIN=60
```

```ts
// middleware/rateLimit.ts
export async function rateLimit(req, res, next) {
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return next(); // no-op in dev
  }
  // TODO (prod): Upstash Redis or Vercel KV token bucket per IP/API key,
  // using RATE_LIMIT_REQUESTS_PER_MIN.
  return next();
}
```

Wire this middleware into all `/v1/*` routes now, even though it's inert, so enabling it in production later doesn't require touching route files.

---

## 6. Caching headers (add now, costs nothing)

On all three `/v1/titles/*/music` GET endpoints:

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800
```

Do **not** cache `/v1/titles` (list endpoint) as aggressively if it's expected to change frequently during dev — `s-maxage=60` is fine there, or skip caching entirely until data stabilizes.

---

## 7. Health-check job (can stub now, wire up later)

Add a script `scripts/checkSoundtrackHealth.ts` (not yet scheduled — just needs to exist and be runnable manually):

```
For each row in soundtracks WHERE is_active = 1:
  - Call Spotify API to check the playlist still exists / isn't private
  - If dead: SET is_active = 0, last_checked_at = now()
  - If alive: SET last_checked_at = now()
```

Leave scheduling (Vercel Cron / GitHub Action) as a TODO comment — not needed until real traffic.

---

## 8. Implementation checklist for the coding agent

- [ ] Run the DROP/CREATE schema block in section 2 against the dev Turso DB.
- [ ] Reseed `titles` + `soundtracks` from source data, running every insert through `resolveOrCreateTitle()` (section 3) instead of direct inserts — this alone prevents the `love-between-lines` / `mr-kill` duplicates from reappearing.
- [ ] Backfill `title_aliases`: every `titles.slug` gets a corresponding `title_aliases` row pointing to itself.
- [ ] Update all three `/v1/titles/*/music` route handlers to query via `title_aliases` for slug lookups and filter `is_active = 1`.
- [ ] Add `confidence` and `match_type` fields to the `music[]` response objects.
- [ ] Add `Cache-Control` headers per section 6.
- [ ] Add the no-op rate-limit middleware per section 5, wired into all `/v1/*` routes.
- [ ] Add `scripts/checkSoundtrackHealth.ts` stub per section 7 (no scheduling yet).
- [ ] Update `/v1/titles` list endpoint's music-count query to filter `is_active = 1`.
