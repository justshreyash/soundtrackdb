/**
 * SingleFlight — In-flight promise deduplication
 * Implements mustToHave.txt section 14:
 * Prevents "thundering herd" and duplicate external fetches when multiple concurrent
 * requests query the exact same un-cataloged title at the exact same moment.
 */

class SingleFlight {
  constructor() {
    this.inFlight = new Map();
  }

  /**
   * Execute or join an active in-flight promise for a unique key.
   * @param {string} key - Unique resource key (e.g. 'imdb:tt1234567')
   * @param {Function} fn - Async worker returning data
   * @returns {Promise<any>}
   */
  async do(key, fn) {
    if (!key) return fn();

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  get activeCount() {
    return this.inFlight.size;
  }
}

const defaultSingleFlight = new SingleFlight();

module.exports = defaultSingleFlight;
