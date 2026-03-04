import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function isYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export const getRoomAvailability = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    try {
      const hostelSlug = String(req.data?.hostelSlug || "").trim();
      const roomId = String(req.data?.roomId || "").trim();
      const from = String(req.data?.from || "").trim(); // YYYY-MM-DD
      const to = String(req.data?.to || "").trim();     // YYYY-MM-DD (to exclusivo)

      if (!hostelSlug) throw new HttpsError("invalid-argument", "hostelSlug requerido");
      if (!roomId) throw new HttpsError("invalid-argument", "roomId requerido");
      if (!isYYYYMMDD(from)) throw new HttpsError("invalid-argument", "from inválido (YYYY-MM-DD)");
      if (!isYYYYMMDD(to)) throw new HttpsError("invalid-argument", "to inválido (YYYY-MM-DD)");
      if (!(from < to)) throw new HttpsError("invalid-argument", "from debe ser menor que to");

      // room_nights docs: { roomId, date:'YYYY-MM-DD', reservationId, ... }
      const col = db.collection(`hostels/${hostelSlug}/room_nights`);

      // 🔥 Esto suele requerir índice compuesto: roomId + date
      const snap = await col
        .where("roomId", "==", roomId)
        .where("date", ">=", from)
        .where("date", "<", to) // to exclusivo
        .orderBy("date", "asc")
        .get();

      const dates = snap.docs
        .map((d) => String((d.data() as any)?.date || ""))
        .filter(Boolean);

      return { ok: true, dates };
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      const code = Number(err?.code ?? 0);

      // ✅ Degradar mientras el índice no está listo / falta
      const isIndexError =
        code === 9 &&
        (msg.includes("The query requires an index") ||
          msg.includes("index is currently building") ||
          msg.includes("create it here"));

      if (isIndexError) {
        // no rompemos UX: el backend createReservation sigue siendo la verdad
        return { ok: true, dates: [], buildingIndex: true };
      }

      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "Error interno");
    }
  }
);