// === FIREBASE SETUP ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// === YOUR FIREBASE CONFIG (Already provided by you) ===
const firebaseConfig = {
  apiKey: "AIzaSyC7cAN-mrE2PvmlQ11zLKAdHBhN7nUFjHw",
  authDomain: "fir-u-c-students-web.firebaseapp.com",
  databaseURL: "https://fir-u-c-students-web-default-rtdb.firebaseio.com",
  projectId: "fir-u-c-students-web",
  storageBucket: "fir-u-c-students-web.firebasestorage.app",
  messagingSenderId: "113569186739",
  appId: "1:113569186739:web:d8daf21059f43a79e841c6"
};

// === INIT FIREBASE ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// === GOOGLE SIGN-IN ===
export function loginWithGoogle() {
  return signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Google Sign-In Success:", result.user);
      return result.user;
    })
    .catch((error) => {
      console.error("Google Login Error:", error.message);
      alert("Google Sign-in failed.");
    });
}

// === LOGOUT ===
export function logoutUser() {
  return signOut(auth)
    .then(() => {
      console.log("User signed out.");
    })
    .catch((error) => {
      console.error("Logout Error:", error.message);
    });
}

// === AUTH STATE LISTENER ===
export function listenForUser(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
