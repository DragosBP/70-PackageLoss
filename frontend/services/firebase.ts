import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

/**
 * Firebase configuration – values are read from EXPO_PUBLIC_* environment
 * variables so that no secrets are committed to the repository.
 *
 * Create a `.env.local` file (see `.env.example`) and add your own project
 * credentials before running the app.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Prevent re-initialising Firebase during hot-reloads in development.
const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default firebaseApp;
