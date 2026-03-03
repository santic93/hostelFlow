import * as admin from "firebase-admin";

/**
 * Inicializa el Admin SDK una sola vez.
 * Esto evita el error "default app does not exist"
 * incluso durante el análisis del deploy.
 */
if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin };

// Helpers comunes
export const db = admin.firestore();
export const auth = admin.auth();