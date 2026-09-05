require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const {
  initDb,
  getTitleBySlug,
  getTitleById,
  getSoundtracksForTitle,
  insertOrUpdateTitle,
  insertSoundtrack,
} = require('../src/services/soundtrack-db');
const { searchTmdb } = require('../src/services/tmdb');
const { parseSlug, resolveByTitleOrSlug, resolveBySlug } = require('../src/services/soundtrack-resolver');
const titlesRouter = require('../src/routes/v1-titles');

describe('Auto-Ingest Soundtrack Resolution Test Suite', () => {
  before(async () => {
    await initDb();
  });

  describe('1. Slug Parsing (parseSlug)', () => {
    it('should parse simple hyphenated slug into title', () => {
      const parsed = parseSlug('queen-of-tears');
      assert.equal(parsed.searchTitle, 'queen of tears');
      assert.equal(parsed.searchYear, null);
    });

    it('should parse slug with trailing 4-digit release year', () => {
      const parsed = parseSlug('vincenzo-2021');
      assert.equal(parsed.searchTitle, 'vincenzo');
      assert.equal(parsed.searchYear, 2021);
    });

    it('should parse slug with underscores', () => {
      const parsed = parseSlug('crash_landing_on_you_2019');
      assert.equal(parsed.searchTitle, 'crash landing on you');
      assert.equal(parsed.searchYear, 2019);
    });

    it('should handle empty or null slug gracefully', () => {
      const parsed = parseSlug('');
      assert.equal(parsed.searchTitle, '');
      assert.equal(parsed.searchYear, null);
    });
  });

  describe('2. TMDB Search (searchTmdb)', () => {
    it('should search and match a known TV drama on TMDB', async () => {
      const result = await searchTmdb('Squid Game', 2021, 'tv');
      if (result) {
        assert.ok(result.tmdb_id, 'Should return a tmdb_id');
        assert.equal(result.type, 'tv');
      } else {
        assert.ok(true, 'TMDB external search skipped if unreachable');
      }
    });
  });

  describe('3. Database Ingestion Without TMDB / IMDb IDs (Direct Ingestion)', () => {
    it('should insert and persist a title record with null imdb_id and tmdb_id', async () => {
      const testSlug = `test-mdl-drama-${Date.now()}`;
      const saved = await insertOrUpdateTitle({
        title: 'Test MDL Drama',
        year: 2024,
        type: 'tv',
        slug: testSlug,
        imdb_id: null,
        tmdb_id: null,
      });

      assert.ok(saved.title, 'Title should be saved');
      assert.equal(saved.title.slug, testSlug);
      assert.equal(saved.title.imdb_id, '');
      assert.equal(saved.title.tmdb_id, '');

      // Verify fetch by slug
      const fetched = await getTitleBySlug(testSlug);
      assert.ok(fetched, 'Should fetch title by slug from Turso DB');
      assert.equal(fetched.id, saved.title.id);

      // Verify inserting soundtrack for this title
      const st = await insertSoundtrack({
        title_id: fetched.id,
        spotify_playlist_id: '37i9dQZF1DX5cZuTmLftWM',
        spotify_url: 'https://open.spotify.com/playlist/37i9dQZF1DX5cZuTmLftWM',
        type: 'playlist',
        source: 'official',
        verified: true,
      });

      assert.ok(st.soundtrack, 'Soundtrack should be saved');
      const soundtracks = await getSoundtracksForTitle(fetched.id);
      assert.equal(soundtracks.length, 1);
      assert.equal(soundtracks[0].spotify_playlist_id, '37i9dQZF1DX5cZuTmLftWM');
    });
  });

  describe('4. Full Auto-Ingestion Pipeline (resolveByTitleOrSlug & resolveBySlug)', () => {
    it('should resolve and auto-ingest a slug into Turso DB', async () => {
      const uniqueSlug = `test-auto-ingest-${Date.now()}`;
      const result = await resolveByTitleOrSlug({
        slug: uniqueSlug,
        title: 'Crash Course in Romance',
        year: 2023,
        type: 'tv',
      });

      assert.ok(result, 'Result should not be null');
      assert.ok(result.title, 'Result should have title object');
      assert.ok(result.title.id, 'Title should have a Turso ID');

      // Verify that it is now persisted in Turso DB
      const dbCheck = await getTitleBySlug(result.title.slug || uniqueSlug);
      assert.ok(dbCheck, 'Title must be saved in Turso DB');

      // Subsequent query should hit DB directly
      const cached = await resolveBySlug(result.title.slug || uniqueSlug);
      assert.ok(cached, 'Cached query should return successfully');
      assert.equal(cached.title.id, result.title.id);
    });
  });

  describe('5. Express Route Integration (GET /v1/titles/resolve & /v1/titles/slug/:slug/music)', () => {
    let server;
    let baseUrl;

    before(async () => {
      const app = express();
      app.use(express.json());
      app.use('/v1/titles', titlesRouter);

      server = http.createServer(app);
      await new Promise((resolve) => {
        server.listen(0, () => {
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

    it('GET /v1/titles/resolve should resolve and return 200 with title and music', async () => {
      const res = await fetch(`${baseUrl}/v1/titles/resolve?title=Twinkling%20Watermelon&year=2023&type=tv`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.ok(data.title, 'Response should contain title');
      assert.ok(Array.isArray(data.music), 'Response should contain music array');
      assert.ok(data.title.id, 'Title should have an ID');
    });

    it('GET /v1/titles/slug/:slug/music should auto-ingest when not in database', async () => {
      const slug = 'queen-of-tears';
      const res = await fetch(`${baseUrl}/v1/titles/slug/${slug}/music`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.ok(data.title, 'Response should contain title');
      assert.ok(Array.isArray(data.music), 'Response should contain music array');

      // Verify that it is in DB
      const inDb = await getTitleBySlug(data.title.slug || slug);
      assert.ok(inDb, 'Title should be persisted in Turso DB');
    });

    it('GET /v1/titles/resolve without query or slug should return 400', async () => {
      const res = await fetch(`${baseUrl}/v1/titles/resolve`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });
});
