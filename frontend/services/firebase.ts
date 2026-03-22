import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCCH-FlLEiAcxed-0wPpA4pyH2Pe8YBGYI',
  authDomain: 'beefapp-86cb5.firebaseapp.com',
  projectId: 'beefapp-86cb5',
  storageBucket: 'beefapp-86cb5.firebasestorage.app',
  messagingSenderId: '88132625917',
  appId: '1:88132625917:android:009dfc499cda86ff6a6594',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);