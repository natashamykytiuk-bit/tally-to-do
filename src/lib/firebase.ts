import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False until .env.local has real keys; the app shows a setup screen instead of crashing. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
if (firebaseConfigured) {
  const existing = getApps()[0]; // fast refresh re-runs this module
  app = existing ?? initializeApp(config);
  // ignoreUndefinedProperties lets optional fields (due, myDay…) be written as undefined.
  db = existing ? getFirestore(app) : initializeFirestore(app, { ignoreUndefinedProperties: true });
}

// TODO(step 8): native auth persistence via getReactNativePersistence + AsyncStorage,
// and Firestore offline persistence.
export const auth: Auth | undefined = app && getAuth(app);
export { db };
