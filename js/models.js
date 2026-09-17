/* ============================================
   MODELS.JS — Data helpers (async via Store)
   ============================================ */

var Models = (function () {

  /* ---------- Load profile (returns Promise) ---------- */
  function loadProfile() {
    return Store.loadProfile();
  }

  /* ---------- Save profile (returns Promise) ---------- */
  function saveProfile(profile) {
    return Store.saveProfile(profile);
  }

  /* ---------- Reset to demo ---------- */
  function resetToDemo() {
    return Store.resetToDemo();
  }

  /* ---------- Generate unique ID ---------- */
  function uid(prefix) {
    if (!prefix) prefix = 'id';
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  return {
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    resetToDemo: resetToDemo,
    uid: uid
  };

})();