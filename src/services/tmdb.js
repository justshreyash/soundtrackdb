const { generateSlug } = require('./soundtrack-validator');

const WD_UA = 'Sportify-API/1.0';

/**
 * Scrapes metadata for a single TMDB media type (movie or tv).
 */
async function fetchTmdbSingle(id, mediaType) {
  try {
    const url = `https://www.themoviedb.org/${mediaType}/${id}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) return null;
    const html = await res.text();

    if (
      html.includes('The page you are looking for can not be found') ||
      html.includes("Oops! We can't find that page.")
    ) {
      return null;
    }

    let title = '';
    let year = null;
    let imdbId = '';
    let voteCount = 0;

    // Extract Title & Year
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitle) {
      title = ogTitle[1].replace(/\s*\(\d{4}\).*$/, '').trim();
      const yMatch = ogTitle[1].match(/\((\d{4})\)/);
      if (yMatch) year = parseInt(yMatch[1], 10);
    }

    // Secondary year extraction
    if (!year) {
      const tagYear = html.match(/<span class="tag release_date">\s*\((\d{4})\)\s*<\/span>/) ||
                      html.match(/<span class="release_date">\s*\((\d{4})\)\s*<\/span>/) ||
                      html.match(/class="release_date"[^>]*>[\s\S]*?(\d{4})/);
      if (tagYear) year = parseInt(tagYear[1], 10);
    }

    // JSON-LD parsing
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ldMatch) {
      try {
        const rawJson = ldMatch[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
        const ld = JSON.parse(rawJson);
        if (ld.name && !title) title = ld.name;
        const d = ld.datePublished || ld.releasedEvent?.[0]?.startDate || ld.startDate || '';
        if (d && !year) year = parseInt(d.slice(0, 4), 10);
        if (ld.aggregateRating?.ratingCount) {
          voteCount = parseInt(ld.aggregateRating.ratingCount, 10);
        }
      } catch {}
    }

    // Extract IMDb ID if present on page
    const imdbMatch = html.match(/href="https:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)/i) ||
                      html.match(/title\/(tt\d+)/i);
    if (imdbMatch) imdbId = imdbMatch[1].toLowerCase();

    const userScore = parseInt(html.match(/data-percent="(\d+)"/)?.[1] || '0', 10);
    const hasPoster = html.includes('poster_path') || html.includes('class="poster');
    const castCount = (html.match(/class="person"/g) || []).length;

    // Quality score to rank TV vs Movie disambiguation
    const score = (voteCount * 5) + (userScore * 2) + (castCount * 3) + (hasPoster ? 20 : 0);

    if (title) {
      const cleanYear = year || new Date().getFullYear();
      return {
        title,
        year: cleanYear,
        type: mediaType,
        imdb_id: imdbId,
        tmdb_id: String(id),
        slug: generateSlug(title, cleanYear),
        score,
      };
    }
  } catch (err) {
    // Network or parse error
  }

  return null;
}

/**
 * Fetch movie/tv metadata from TMDB API (if key present) or smart web disambiguation.
 */
async function fetchTmdbMetadata(tmdbId, mediaType) {
  if (!tmdbId) return null;
  const id = String(tmdbId).trim();

  // 1. Try TMDB API v3 if API key is provided
  const apiKey = process.env.TMDB_API_KEY || process.env.TMDB_KEY;
  if (apiKey) {
    const typesToTry = mediaType ? [mediaType] : ['tv', 'movie'];
    for (const t of typesToTry) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${t}/${id}?api_key=${apiKey}&language=en-US&append_to_response=external_ids`);
        if (res.ok) {
          const json = await res.json();
          const title = json.title || json.name || json.original_title || json.original_name || '';
          const releaseDate = json.release_date || json.first_air_date || '';
          const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : new Date().getFullYear();
          const imdbId = json.external_ids?.imdb_id || json.imdb_id || '';

          if (title) {
            return {
              title,
              year,
              type: t,
              imdb_id: imdbId,
              tmdb_id: id,
              slug: generateSlug(title, year),
              overview: json.overview || '',
            };
          }
        }
      } catch {}
    }
  }

  // 2. Wikidata SPARQL lookup (accurate and fast)
  try {
    const sparqlProps = mediaType === 'tv'
      ? `?item wdt:P4983 "${id}". BIND("tv" AS ?itemType)`
      : mediaType === 'movie'
      ? `?item wdt:P4947 "${id}". BIND("movie" AS ?itemType)`
      : `{ ?item wdt:P4983 "${id}". BIND("tv" AS ?itemType) } UNION { ?item wdt:P4947 "${id}". BIND("movie" AS ?itemType) }`;

    const sparql = `SELECT ?item ?label ?imdb ?year ?itemType WHERE {
      ${sparqlProps}
      ?item rdfs:label ?label. FILTER(LANG(?label) = "en").
      OPTIONAL { ?item wdt:P345 ?imdb. }
      OPTIONAL { ?item wdt:P577 ?date. BIND(YEAR(?date) AS ?year) }
      OPTIONAL { ?item wdt:P580 ?startDate. BIND(YEAR(?startDate) AS ?year) }
    } LIMIT 1`;

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      headers: { 'User-Agent': WD_UA, Accept: 'application/sparql-results+json' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.ok) {
      const data = await res.json();
      const hit = data?.results?.bindings?.[0];
      if (hit && hit.label?.value) {
        const title = hit.label.value;
        const year = hit.year?.value ? parseInt(hit.year.value, 10) : null;
        const imdbId = hit.imdb?.value || '';
        const resolvedType = hit.itemType?.value || mediaType || 'movie';

        if (title && year) {
          return {
            title,
            year,
            type: resolvedType,
            imdb_id: imdbId,
            tmdb_id: id,
            slug: generateSlug(title, year),
          };
        }
      }
    }
  } catch {}

  // 3. Web Disambiguation (Checks both TV & Movie candidates in parallel and selects the highest scoring)
  if (mediaType) {
    return fetchTmdbSingle(id, mediaType);
  }

  const [tvCandidate, movieCandidate] = await Promise.all([
    fetchTmdbSingle(id, 'tv'),
    fetchTmdbSingle(id, 'movie'),
  ]);

  if (tvCandidate && !movieCandidate) return tvCandidate;
  if (movieCandidate && !tvCandidate) return movieCandidate;
  if (!tvCandidate && !movieCandidate) return null;

  // Pick the candidate with higher popularity / votes / user score
  return (tvCandidate.score >= movieCandidate.score) ? tvCandidate : movieCandidate;
}

/**
 * Fetch metadata from IMDb ID
 */
async function fetchImdbMetadata(imdbId) {
  if (!imdbId) return null;
  const cleanImdb = String(imdbId).trim().toLowerCase();

  // Try Wikidata by IMDb ID
  try {
    const sparql = `SELECT ?item ?label ?tmdbMovie ?tmdbTv ?year WHERE {
      ?item wdt:P345 "${cleanImdb}".
      ?item rdfs:label ?label. FILTER(LANG(?label) = "en").
      OPTIONAL { ?item wdt:P4947 ?tmdbMovie. }
      OPTIONAL { ?item wdt:P4983 ?tmdbTv. }
      OPTIONAL { ?item wdt:P577 ?date. BIND(YEAR(?date) AS ?year) }
      OPTIONAL { ?item wdt:P580 ?startDate. BIND(YEAR(?startDate) AS ?year) }
    } LIMIT 1`;

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      headers: { 'User-Agent': WD_UA, Accept: 'application/sparql-results+json' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.ok) {
      const data = await res.json();
      const hit = data?.results?.bindings?.[0];
      if (hit && hit.label?.value) {
        const title = hit.label.value;
        const year = hit.year?.value ? parseInt(hit.year.value, 10) : new Date().getFullYear();
        const tmdbId = hit.tmdbTv?.value || hit.tmdbMovie?.value || '';
        const resolvedType = hit.tmdbTv ? 'tv' : 'movie';

        return {
          title,
          year,
          type: resolvedType,
          imdb_id: cleanImdb,
          tmdb_id: tmdbId,
          slug: generateSlug(title, year),
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Search TMDB for a movie or TV show by query, optional year, and media type.
 */
async function searchTmdb(query, year = null, mediaType = null) {
  if (!query) return null;
  const cleanQuery = String(query).trim();
  if (!cleanQuery) return null;

  const apiKey = process.env.TMDB_API_KEY || process.env.TMDB_KEY;
  if (!apiKey) return null;

  try {
    let url;
    if (mediaType === 'tv') {
      url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&language=en-US${year ? `&first_air_date_year=${year}` : ''}`;
    } else if (mediaType === 'movie') {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&language=en-US${year ? `&year=${year}` : ''}`;
    } else {
      url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&language=en-US`;
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) return null;
    const json = await res.json();
    const results = json.results || [];
    if (!results.length) return null;

    const queryLower = cleanQuery.toLowerCase();
    const scored = results
      .map(item => {
        const itemType = item.media_type || mediaType || (item.first_air_date ? 'tv' : 'movie');
        if (itemType !== 'tv' && itemType !== 'movie') return null;

        const title = item.title || item.name || item.original_title || item.original_name || '';
        const releaseDate = item.release_date || item.first_air_date || '';
        const itemYear = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : null;
        const titleLower = title.toLowerCase();

        let score = 0;
        if (titleLower === queryLower) {
          score += 100;
        } else if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
          score += 50;
        }

        if (year && itemYear) {
          if (itemYear === parseInt(year, 10)) {
            score += 40;
          } else if (Math.abs(itemYear - parseInt(year, 10)) === 1) {
            score += 20;
          }
        }

        score += Math.min(item.popularity || 0, 40);
        score += Math.min((item.vote_count || 0) / 10, 30);

        return {
          tmdb_id: String(item.id),
          type: itemType,
          title,
          year: itemYear,
          score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return scored[0];
    }
  } catch (err) {
    console.warn(`TMDB API search failed for "${cleanQuery}":`, err.message);
  }

  // 2. Fallback: Wikidata SPARQL lookup by title
  try {
    const sparqlProps = mediaType === 'tv'
      ? `?item wdt:P4983 ?tmdbId. BIND("tv" AS ?itemType)`
      : mediaType === 'movie'
      ? `?item wdt:P4947 ?tmdbId. BIND("movie" AS ?itemType)`
      : `{ ?item wdt:P4983 ?tmdbId. BIND("tv" AS ?itemType) } UNION { ?item wdt:P4947 ?tmdbId. BIND("movie" AS ?itemType) }`;

    const sparql = `SELECT ?item ?label ?tmdbId ?year ?itemType WHERE {
      ?item rdfs:label "${cleanQuery.replace(/"/g, '\\"')}"@en.
      ${sparqlProps}
      OPTIONAL { ?item wdt:P577 ?date. BIND(YEAR(?date) AS ?year) }
      OPTIONAL { ?item wdt:P580 ?startDate. BIND(YEAR(?startDate) AS ?year) }
    } LIMIT 1`;

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      headers: { 'User-Agent': WD_UA, Accept: 'application/sparql-results+json' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));

    if (res.ok) {
      const data = await res.json();
      const hit = data?.results?.bindings?.[0];
      if (hit && hit.tmdbId?.value) {
        return {
          tmdb_id: String(hit.tmdbId.value),
          type: hit.itemType?.value || mediaType || 'movie',
          title: cleanQuery,
          year: hit.year?.value ? parseInt(hit.year.value, 10) : (year ? parseInt(year, 10) : null),
        };
      }
    }
  } catch {}

  return null;
}

module.exports = {
  fetchTmdbMetadata,
  fetchImdbMetadata,
  searchTmdb,
};
