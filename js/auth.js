/* ============================================
   AUTH.JS — Login, Signup, Google, Logout
   ============================================ */

var currentMode = 'signin';

document.addEventListener('DOMContentLoaded', function () {

  // If already signed in → go to dashboard
  auth.onAuthStateChanged(function (user) {
    if (user) {
      console.log('✅ Already signed in:', user.email);
      window.location.href = 'pages/dashboard.html';
    }
  });

  setupAuthTabs();
  setupEmailForm();
  setupGoogleButton();
});

/* ---------- Toggle Sign In / Sign Up ---------- */
function setupAuthTabs() {
  var tabSignIn = document.getElementById('tab-signin');
  var tabSignUp = document.getElementById('tab-signup');

  tabSignIn.addEventListener('click', function () { setMode('signin'); });
  tabSignUp.addEventListener('click', function () { setMode('signup'); });
}

function setMode(mode) {
  currentMode = mode;
  var tabSignIn = document.getElementById('tab-signin');
  var tabSignUp = document.getElementById('tab-signup');
  var submitBtn = document.getElementById('auth-submit');
  var footerNote = document.getElementById('auth-footer-note');

  if (mode === 'signin') {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    submitBtn.textContent = 'Sign In';
    footerNote.textContent = 'Sign in to access your dashboard.';
  } else {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    submitBtn.textContent = 'Create Account';
    footerNote.textContent = 'Create an account to start building your profile.';
  }
  hideError();
}

/* ---------- Email/Password form ---------- */
function setupEmailForm() {
  var form = document.getElementById('auth-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = document.getElementById('auth-email').value.trim();
    var password = document.getElementById('auth-password').value;

    if (!email || !password) {
      showError('Please enter email and password.');
      return;
    }

    setLoading(true);

    if (currentMode === 'signin') {
      auth.signInWithEmailAndPassword(email, password)
        .then(function () {
          window.location.href = 'pages/dashboard.html';
        })
        .catch(function (err) {
          setLoading(false);
          showError(friendlyError(err));
        });
    } else {
      auth.createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
          return createInitialUserProfile(cred.user);
        })
        .then(function () {
          window.location.href = 'pages/dashboard.html';
        })
        .catch(function (err) {
          setLoading(false);
          showError(friendlyError(err));
        });
    }
  });
}

/* ---------- Google Sign-In ---------- */
function setupGoogleButton() {
  var btn = document.getElementById('btn-google');
  btn.addEventListener('click', function () {
    setLoading(true);
    auth.signInWithPopup(googleProvider)
      .then(function (result) {
        return createInitialUserProfile(result.user);
      })
      .then(function () {
        window.location.href = 'pages/dashboard.html';
      })
      .catch(function (err) {
        setLoading(false);
        showError(friendlyError(err));
      });
  });
}

/* ---------- Create first-time user profile in Firestore ---------- */
/* Seeds new users with the Arjun demo profile */
function createInitialUserProfile(user) {
  var ref = db.collection('users').doc(user.uid);

  return ref.get().then(function (doc) {
    if (doc.exists) {
      // Returning user — nothing to do
      return null;
    }
    // New user — seed with demo data
    var seeded = SeedData.getDemoProfile(
      user.uid,
      user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
      user.email || ''
    );
    return ref.set(seeded);
  });
}

/* ---------- UI helpers ---------- */
function showError(msg) {
  var el = document.getElementById('auth-error');
  el.textContent = msg;
  el.hidden = false;
}

function hideError() {
  var el = document.getElementById('auth-error');
  el.hidden = true;
  el.textContent = '';
}

function setLoading(isLoading) {
  var btn = document.getElementById('auth-submit');
  var googleBtn = document.getElementById('btn-google');

  btn.disabled = isLoading;
  googleBtn.disabled = isLoading;

  if (isLoading) {
    btn.textContent = currentMode === 'signin' ? 'Signing in...' : 'Creating account...';
  } else {
    btn.textContent = currentMode === 'signin' ? 'Sign In' : 'Create Account';
  }
}

function friendlyError(err) {
  var code = err.code || '';
  switch (code) {
    case 'auth/invalid-email':          return 'That email address is invalid.';
    case 'auth/user-not-found':         return 'No account found with that email.';
    case 'auth/wrong-password':         return 'Incorrect password.';
    case 'auth/invalid-credential':     return 'Incorrect email or password.';
    case 'auth/email-already-in-use':   return 'That email is already registered. Try signing in.';
    case 'auth/weak-password':          return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':   return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':          return 'Pop-up blocked. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':return 'Another sign-in is in progress.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default:                            return err.message || 'Something went wrong. Try again.';
  }
}