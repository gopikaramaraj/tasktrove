import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCY25YQW4R3qK8OIBZftfQQ8X-9kcpdME4",
  authDomain: "tasktrove-in.firebaseapp.com",
  projectId: "tasktrove-in",
  storageBucket: "tasktrove-in.firebasestorage.app",
  messagingSenderId: "1017115436511",
  appId: "1:1017115436511:web:c3ee35dd61da3695f3106a",
  measurementId: "G-XE26FBEH56"
};

// Initialize Firebase only on the client side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
