import admin from 'firebase-admin';
import config from './index.js';
import logger from '../utils/logger.js';

let firebaseReady = false;

function initFirebase() {
  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey || privateKey.includes('...')) {
    logger.warn('[firebase] Credentials not configured — Firebase Admin SDK disabled.');
    return null;
  }

  if (admin.apps.length) return admin.app();

  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  firebaseReady = true;
  logger.info(`[firebase] Admin SDK initialized for project ${projectId}`);
  return app;
}

const firebaseApp = initFirebase();

export const isFirebaseReady = () => firebaseReady;

export async function verifyFirebaseToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Firebase auth is not configured on the server');
  }
  return admin.auth(firebaseApp).verifyIdToken(idToken);
}

export async function getFirebaseUser(uid) {
  if (!firebaseApp) return null;
  return admin.auth(firebaseApp).getUser(uid);
}

export default firebaseApp;
