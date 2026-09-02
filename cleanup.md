# SoundtrackDB — Codebase Cleanup Instructions

Goal: remove dead code, unused files, unused dependencies, and unused functions —
**without breaking anything that currently works.** This is a cleanup pass, not a
refactor. Do not change behavior of any working endpoint, script, or middleware.

---

## Ground rules (read first)

1. **Nothing gets deleted without being listed first.** Produce a full report of
   everything you intend to remove *before* removing it. Wait for confirmation on
   anything you're not fully certain about — but you don't need to ask about
   things you're highly confident are dead (see confidence tiers below).
2. **Grep before you delete.** For every file, function, export, or package you
   flag as unused, show the search you ran to confirm it has zero references
   elsewhere in the codebase (including dynamic `require()`/`import()` calls,
   `vercel.json`, `package.json` scripts, and env-var-gated code paths).
3. **One-off/manual scripts are not "unused" just because they're not imported
   anywhere.** `scripts/rebuild-schema.js`, `scripts/migrate-to-turso.js`, and
   `scripts/checkSoundtrackHealth.js` are intentionally invoked manually via
   `node scripts/...` — do not flag these as dead code just because nothing
   `require()`s them. Confirm a script is truly abandoned (e.g. superseded by a
   newer version of itself) before touching it.
4. **Don't touch anything env-var-gated as "unused."** e.g. the rate-limit
   middleware's Redis/KV branch may look unreachable in local dev if
   `RATE_LIMIT_ENABLED=false`, but it's live code for production. Trace the
   conditional, don't just check if it currently executes.
5. **Run the full smoke test suite after cleanup, before declaring done.**
   If no automated tests exist, manually re-hit every route listed in
   "Verification" below and confirm identical responses to before cleanup.

---

## What to look for

### 1. Unused files
- Any `.js`/`.ts` file with zero incoming references (no `require`/`import`
  anywhere, not referenced in `package.json` `scripts`, not referenced in
  `vercel.json`, not a route file Express/Vercel auto-mounts by convention).
- Old/superseded versions of files — check for things like `soundtrack-db.old.js`,
  `v1-titles-backup.js`, `*.bak`, commented-out duplicate files.
- Leftover files from earlier stages of this project (e.g. any pre-Turso SQLite
  file artifacts, old JSON seed files that were replaced by newer ones in
  `data/`, any `test-*.js` scratch files left in the repo root instead of a
  proper test directory).

### 2. Unused exports/functions within files that ARE used
- Functions exported from `soundtrack-db.js`, `soundtrack-resolver.js`, etc.
  that nothing imports. Common culprits after refactors like ours: an old
  `insertOrUpdateTitle()` or `getTitleBySlug()` that was replaced by
  `resolveOrCreateTitle()` / `getTitleByAlias()` but never deleted.
  **This is the highest-value target** — we know from recent work that direct
  insert/lookup functions were explicitly replaced; check if the old ones are
  still sitting in the file unused.
- Dead branches: `if (false)`, commented-out blocks of >5 lines, feature flags
  that are permanently on/off with no plan to change them.
- Unused imports at the top of every file (most linters catch this — run the
  linter first, see below).

### 3. Unused npm packages
- Cross-reference every dependency in `package.json` against actual `require`/
  `import` usage in the codebase (`grep -r "require('PACKAGE_NAME'"` and
  `grep -r "from 'PACKAGE_NAME'"` for each one, including partial matches for
  scoped packages).
- Flag devDependencies vs dependencies separately — don't assume a
  build-only tool is unused just because it's not in app code.
- Check for packages that were installed for an approach we abandoned
  (e.g. if any SQLite-direct driver was installed before moving fully to the
  Turso client, or an old rate-limit library that predates the current
  middleware).

### 4. Dead config / env vars
- Any variable referenced in `.env.example` that's no longer read anywhere
  in the code (or vice versa: read in code but missing from `.env.example`,
  which isn't "cleanup" but IS a bug worth flagging while you're in there).
- Any `vercel.json` entries pointing at files that no longer exist.

---

## Confidence tiers for the report

Structure your findings into three tiers so it's fast to review:

**🟢 Safe to remove automatically** — zero references anywhere, confirmed by
grep, not a manual script, not env-gated. List these and remove them directly.

**🟡 Probably dead, confirm before removing** — no references found, but it's
the kind of thing that could be called dynamically, from an external cron/webhook,
or from tooling outside this repo (e.g. a function only ever called from a
Vercel Cron config, or something that looks like it might be a public API
export other services could depend on). List these with your reasoning; wait
for a go-ahead.

**🔴 Do not remove, flagged for awareness only** — things that look unused
but are actually load-bearing (manual scripts, env-gated prod code, anything
referenced only in `vercel.json` or `README.md` usage instructions). List
these just so I know you checked and consciously kept them.

---

## Output format

Produce a single report before making any changes:

```
## Cleanup Report

### 🟢 Safe to remove (removing now)
- path/to/file.js — reason: zero references, confirmed via `grep -r`
- functionName() in path/to/other.js — reason: superseded by newFunctionName(), zero call sites
- package-name (package.json) — reason: no require/import found anywhere

### 🟡 Needs your confirmation
- path/to/maybe-dead.js — reason: no references found, but filename suggests it might be called externally

### 🔴 Kept intentionally (not dead, just looked like it)
- scripts/rebuild-schema.js — manual-invoke script, not meant to be imported
- rate-limit.js Redis branch — env-gated, dead only when RATE_LIMIT_ENABLED=false
```

Then, **after I confirm the 🟡 tier**, make the actual changes and run the
verification steps below, reporting pass/fail on each.

---

## Verification (run after cleanup, before declaring done)

- [ ] Server starts with no errors (`npm run dev` or equivalent)
- [ ] `GET /v1/titles` returns the same shape/count as before cleanup
- [ ] `GET /v1/titles/imdb/:id/music` returns identical response for a known-good id
- [ ] `GET /v1/titles/tmdb/:id/music` — same
- [ ] `GET /v1/titles/slug/:slug/music` — same, including an alias slug (not the canonical one)
- [ ] Input validation still rejects the known bad inputs (SQL injection, path traversal — reuse the earlier 20-case test suite if it still exists in the repo)
- [ ] Rate limiter still triggers 429 at the configured threshold
- [ ] `node scripts/checkSoundtrackHealth.js --dry-run` still runs without error
- [ ] `node scripts/migrate-to-turso.js` still runs without error against a scratch/dev DB (don't run against prod data)
- [ ] `npm install` (or equivalent) still succeeds after any package.json trims — confirms nothing was actually needed transitively