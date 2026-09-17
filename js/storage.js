/* ============================================
   STORAGE.JS — localStorage wrapper
   ============================================
   Why this file?
   Instead of calling localStorage directly everywhere,
   we centralize it here. Later, we can swap this for
   Firebase without changing the rest of the app.
   ============================================ */

const Storage = (() => {
  // Namespace prefix — avoids collision with other sites' localStorage
  const PREFIX = 'proofchain_';

  /**
   * Save a value (object or primitive) under a key.
   */
  function save(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(PREFIX + key, serialized);
      return true;
    } catch (err) {
      console.error('Storage.save error:', err);
      return false;
    }
  }

  /**
   * Read a value by key. Returns fallback if missing.
   */
  function load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Storage.load error:', err);
      return fallback;
    }
  }

  /**
   * Remove a key.
   */
  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  /**
   * Clear ALL ProofChain data (not other sites' data).
   */
  function clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }

  /**
   * Debug helper — dump everything we've stored.
   */
  function dump() {
    const out = {};
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => {
        out[k.replace(PREFIX, '')] = JSON.parse(localStorage.getItem(k));
      });
    console.table(out);
    return out;
  }

  return { save, load, remove, clearAll, dump };
})();