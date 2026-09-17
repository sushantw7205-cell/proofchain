/* ============================================
   STORE.JS — Cloud-aware storage layer
   ============================================
   - If user is signed in → read/write Firestore
   - If not signed in      → fallback to localStorage
   ============================================ */

var Store = (function () {

  var currentUser = null;
  var _readyResolvers = [];
  var _isReady = false;

  // Wait for Firebase Auth to resolve
  if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(function (user) {
      currentUser = user || null;
      _isReady = true;
      _readyResolvers.forEach(function (fn) { fn(currentUser); });
      _readyResolvers = [];
    });
  } else {
    // Firebase not loaded — pure localStorage mode
    _isReady = true;
  }

  /* ---------- Wait for auth to resolve ---------- */
  function ready() {
    return new Promise(function (resolve) {
      if (_isReady) return resolve(currentUser);
      _readyResolvers.push(resolve);
    });
  }

  function getUser() {
    return currentUser;
  }

  function isSignedIn() {
    return !!currentUser;
  }

  /* ---------- Firestore doc ref for current user ---------- */
  function userDocRef() {
    if (!currentUser) return null;
    return db.collection('users').doc(currentUser.uid);
  }

  /* ============================================
     LOAD PROFILE
     ============================================ */
  function loadProfile() {
    // Not signed in → use localStorage
    if (!currentUser) {
      var local = Storage.load('profile');
      if (!local || !local.student || !Array.isArray(local.skills)) {
        var demo = SeedData.getDemoProfile(null, 'Guest Student', '');
        Storage.save('profile', demo);
        return Promise.resolve(demo);
      }
      return Promise.resolve(local);
    }

    // Signed in → fetch from Firestore
    return userDocRef().get().then(function (doc) {
      if (doc.exists) {
        var data = doc.data();
        if (data && data.student && Array.isArray(data.skills)) {
          // Keep localStorage as offline cache
          Storage.save('profile', data);
          return data;
        }
      }
      // No doc → create with demo data
      var seeded = SeedData.getDemoProfile(
        currentUser.uid,
        currentUser.displayName || 'Student',
        currentUser.email || ''
      );
      return userDocRef().set(seeded).then(function () {
        Storage.save('profile', seeded);
        return seeded;
      });
    }).catch(function (err) {
      console.warn('Firestore load failed — using local cache:', err);
      var cached = Storage.load('profile');
      if (cached) return cached;
      var fresh = SeedData.getDemoProfile(
        currentUser.uid,
        currentUser.displayName || 'Student',
        currentUser.email || ''
      );
      return fresh;
    });
  }

  /* ============================================
     SAVE PROFILE
     ============================================ */
  function saveProfile(profile) {
    // Always cache locally
    Storage.save('profile', profile);

    // If signed in → write to Firestore
    if (currentUser) {
      return userDocRef().set(profile).catch(function (err) {
        console.error('Firestore save failed:', err);
        return false;
      });
    }
    return Promise.resolve(true);
  }

  /* ============================================
     RESET TO DEMO
     ============================================ */
  function resetToDemo() {
    var fresh;
    if (currentUser) {
      fresh = SeedData.getDemoProfile(
        currentUser.uid,
        currentUser.displayName || 'Student',
        currentUser.email || ''
      );
    } else {
      fresh = SeedData.getDemoProfile(null, 'Guest Student', '');
    }

    Storage.save('profile', fresh);
    if (currentUser) {
      return userDocRef().set(fresh).then(function () { return fresh; });
    }
    return Promise.resolve(fresh);
  }

  /* ============================================
     LOGOUT
     ============================================ */
  function logout() {
    if (typeof auth !== 'undefined' && auth) {
      return auth.signOut();
    }
    return Promise.resolve();
  }

  /* ============================================
     PUBLIC API
     ============================================ */
  return {
    ready: ready,
    getUser: getUser,
    isSignedIn: isSignedIn,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    resetToDemo: resetToDemo,
    logout: logout
  };
})();