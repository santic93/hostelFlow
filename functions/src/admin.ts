import * as admin from "firebase-admin";

/**
 * Inicializa Firebase Admin una sola vez.
 */
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };