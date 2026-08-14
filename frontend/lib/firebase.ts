import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  initializeRecaptchaConfig,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  type Auth,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

export const app: FirebaseApp | null = isFirebaseConfigured()
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured');
  return signInWithPopup(auth, googleProvider);
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier(): RecaptchaVerifier {
  if (!auth) throw new Error('Firebase is not configured');
  // Clear any previously rendered widget so repeated OTP requests work.
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      /* noop */
    }
    recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) container.innerHTML = '';
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'normal',
  });
  return recaptchaVerifier;
}

export async function sendPhoneOtp(phoneNumber: string): Promise<ConfirmationResult> {
  if (!auth) throw new Error('Firebase is not configured');
  // Load the project's reCAPTCHA (Enterprise) config so the OTP flow uses the
  // provisioned site key instead of the legacy widget.
  await initializeRecaptchaConfig(auth);
  const appVerifier = getRecaptchaVerifier();
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

export async function confirmPhoneOtp(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
}

export async function signOutUser() {
  if (!auth) return;
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
