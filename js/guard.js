/* ============================================
   GUARD.JS — Page protection + user navbar
   ============================================
   Add this to every protected page (dashboard,
   profile, evidence, assessment, recruiter).
   ============================================ */

(function () {

  // Wait for Firebase auth to resolve
  auth.onAuthStateChanged(function (user) {
    if (!user) {
      // Not signed in → redirect to login
      console.log('🔒 Not signed in — redirecting to login');
      window.location.href = getLoginPath();
      return;
    }

    console.log('✅ Signed in as:', user.email);
    injectUserNav(user);
  });

  /* ---------- Compute path to login.html ---------- */
  function getLoginPath() {
    // If we're inside /pages/, go up one level
    if (window.location.pathname.indexOf('/pages/') !== -1) {
      return '../login.html';
    }
    return 'login.html';
  }

  /* ---------- Add user info + logout to navbar ---------- */
  function injectUserNav(user) {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Avoid double injection
    if (document.getElementById('nav-user-menu')) return;

    var displayName = user.displayName
      || (user.email ? user.email.split('@')[0] : 'User');
    var initial = displayName.charAt(0).toUpperCase();

    var navUser = document.createElement('div');
    navUser.id = 'nav-user-menu';
    navUser.className = 'nav-user-menu';

    navUser.innerHTML =
      '<div class="nav-user-avatar">' + initial + '</div>' +
      '<div class="nav-user-info">' +
        '<span class="nav-user-name">' + escapeHtml(displayName) + '</span>' +
        '<button class="nav-user-logout" id="nav-logout">Sign out</button>' +
      '</div>';

    navbar.appendChild(navUser);

    document.getElementById('nav-logout').addEventListener('click', function () {
      if (confirm('Sign out of ProofChain?')) {
        auth.signOut().then(function () {
          window.location.href = getLoginPath();
        });
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();