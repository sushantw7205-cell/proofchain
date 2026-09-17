/* ============================================
   FIREBASE.JS — Firebase init + Firestore helpers
   ============================================ */

var firebaseConfig = {
  apiKey: "AIzaSyDvyrFqawWCEGUw87OlJQEEIKGcfM0zZbI",
  authDomain: "proofchain-55c7e.firebaseapp.com",
  projectId: "proofchain-55c7e",
  storageBucket: "proofchain-55c7e.firebasestorage.app",
  messagingSenderId: "828189510501",
  appId: "1:828189510501:web:7943056542ab777b4a6f8c"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var db = firebase.firestore();
var googleProvider = new firebase.auth.GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

// Enable offline persistence (data cached locally when offline)
db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});

console.log('✅ Firebase initialized');