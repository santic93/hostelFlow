import * as admin from "firebase-admin";
import path from "path";
import fs from "fs";

// ✅ Ruta al JSON (cambiá si lo guardaste en otro lado)
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ No encuentro el service account JSON en:", SERVICE_ACCOUNT_PATH);
  console.error("   Colocalo ahí o cambiá la ruta en el script.");
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  const email = "santiagocastro.sac@gmail.com";

  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, {
    role: "superadmin",
  });

  console.log("✅ Superadmin asignado correctamente");
  console.log("Email:", email);
  console.log("UID:", user.uid);
  console.log("IMPORTANTE: cerrar sesión y volver a loguearse para refrescar el token.");
}

main().catch((e) => {
  console.error("❌ Error asignando superadmin:", e);
  process.exit(1);
});