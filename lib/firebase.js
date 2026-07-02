import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Next.js static export renders modules on the server once during
// build, so guard against re-initializing the app on every import.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check is the real protection against scripted abuse (brute-forcing
// workspace codes, mass workspace creation, etc.) — it rejects Firestore
// and Realtime Database requests that don't come from this app's real
// web pages. It only runs in the browser and only if a reCAPTCHA v3 site
// key is configured, so local development without one still works.
//
// Setup: Firebase Console > App Check > register this web app with
// reCAPTCHA v3, then set NEXT_PUBLIC_RECAPTCHA_SITE_KEY. Enforcement
// (rejecting unverified requests) is turned on separately per-product
// in the App Check console once you've confirmed real traffic passes.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
export const storage = getStorage(firebaseApp);
