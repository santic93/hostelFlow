import * as admin from "firebase-admin";

admin.initializeApp();

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Uso: npx ts-node scripts/setSuperAdmin.ts "email@dominio.com"');
  }

  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, {
    role: "superadmin",
  });

  console.log("OK ✅ superadmin seteado:", { email, uid: user.uid });
  console.log("IMPORTANTE: ese usuario debe cerrar sesión y volver a iniciar sesión para refrescar el token.");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});