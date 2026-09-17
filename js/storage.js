/* STORAGE.JS — localStorage wrapper */

var Storage = (function () {
  var PREFIX = 'proofchain_';

  function save(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Storage.save error:', err);
      return false;
    }
  }

  function load(key, fallback) {
    if (fallback === undefined) fallback = null;
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Storage.load error:', err);
      return fallback;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function clearAll() {
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(PREFIX) === 0) {
        localStorage.removeItem(keys[i]);
      }
    }
  }

  function dump() {
    var out = {};
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(PREFIX) === 0) {
        var cleanKey = keys[i].replace(PREFIX, '');
        out[cleanKey] = JSON.parse(localStorage.getItem(keys[i]));
      }
    }
    console.table(out);
    return out;
  }

  return {
    save: save,
    load: load,
    remove: remove,
    clearAll: clearAll,
    dump: dump
  };
})();