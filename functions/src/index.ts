import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

/**
 * ✅ PARAMS (no secrets) -> quedan en .env.<projectId> automáticamente al deploy
 * O te los pregunta firebase deploy y te los escribe.
 */
const MAIL_FROM_EMAIL = defineString("MAIL_FROM_EMAIL", {
  default: "no-reply@hostly.app",
});
const MAIL_FROM_NAME = defineString("MAIL_FROM_NAME", {
  default: "Hostly",
});

/**
 * ✅ SECRET (Brevo API Key) -> se setea con:
 * firebase functions:secrets:set BREVO_API_KEY
 */
const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

/** ---------- helpers ---------- */

function assert(condition: any, code: any, message: string) {
  if (!condition) throw new HttpsError(code, message);
}

function toUTCDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function formatYYYYMMDD_UTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * check-in inclusive, check-out exclusive
 */
function buildNights(from: Date, to: Date) {
  const start = toUTCDateOnly(from);
  const end = toUTCDateOnly(to);
  const nights: string[] = [];

  for (let cur = new Date(start); cur < end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    nights.push(formatYYYYMMDD_UTC(cur));
  }
  return nights;
}

function lockDocId(roomId: string, yyyyMMdd: string) {
  return `${roomId}_${yyyyMMdd}`;
}

type ReservationStatus = "pending" | "confirmed" | "cancelled";

function isValidStatus(s: string): s is ReservationStatus {
  return s === "pending" || s === "confirmed" || s === "cancelled";
}

function canTransition(from: ReservationStatus, to: ReservationStatus) {
  // ajustalo como quieras
  if (from === "cancelled") return false;
  return true;
}

function reservationEmailHtml(args: {
  title: string;
  hostelName: string;
  roomName: string;
  fullName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  status: string;
}) {
  const { title, hostelName, roomName, fullName, checkIn, checkOut, nights, total, status } = args;

  return `
  <div style="font-family:Arial,sans-serif; line-height:1.5;">
    <h2 style="margin:0 0 12px;">${title}</h2>
    <p>Hola <b>${fullName}</b>,</p>
    <p>Tu reserva en <b>${hostelName.toUpperCase()}</b> está <b>${status === "CONFIRMED" ? "CONFIRMADA" : status === "CANCELLED" ? "CANCELADA" : "PENDIENTE"}</b>.</p>
    <ul>
      <li><b>Habitación:</b> ${roomName}</li>
      <li><b>Check-in:</b> ${checkIn}</li>
      <li><b>Check-out:</b> ${checkOut}</li>
      <li><b>Noches:</b> ${nights}</li>
      <li><b>Total:</b> $${total}</li>
    </ul>
    <p style="color:#666;">Si necesitás modificar o cancelar, contactá al hostel.</p>
  </div>`;
}

/** ---------- Brevo mail ---------- */

async function sendEmailBrevo(args: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}) {
  const apiKey = BREVO_API_KEY.value();
  if (!apiKey) {
    console.warn("BREVO_API_KEY not set. Skipping email.");
    return;
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: MAIL_FROM_EMAIL.value(), name: MAIL_FROM_NAME.value() },
      to: [{ email: args.to, name: args.toName || "" }],
      subject: args.subject,
      htmlContent: args.html,
    },
    {
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      timeout: 15000,
    }
  );
}

/**
 * ✅ ESTO ES LO QUE ME PEDISTE
 * Va EN ESTE MISMO ARCHIVO (index.ts), abajo de sendEmailBrevo.
 * La función “safe” evita que un fallo de mail rompa la reserva (y te tire 500).
 */
async function sendEmailBrevoSafe(args: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}) {
  try {
    await sendEmailBrevo(args);
  } catch (err: any) {
    console.error("Brevo send failed (NOT blocking reservation).", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    // ✅ NO throw. Nunca tires error por mail.
  }
}

/** ---------- FUNCTIONS ---------- */

/**
 * createReservation (PUBLIC)
 * data: { hostelSlug, roomId, checkInISO, checkOutISO, fullName, email }
 *
 * ✅ IMPORTANTÍSIMO:
 * - La reserva se crea en transacción (locks anti solapamiento)
 * - El mail va fuera de la transacción
 * - El mail NO rompe la reserva (sendEmailBrevoSafe)
 */
export const createReservation = onCall(
  {
    region: "us-central1",
    secrets: [BREVO_API_KEY],
     enforceAppCheck: true,
  },
  async (request) => {
    const data = request.data as any;

    const hostelSlug = String(data?.hostelSlug || "").trim();
    const roomId = String(data?.roomId || "").trim();
    const fullName = String(data?.fullName || "").trim();
    const email = String(data?.email || "").trim().toLowerCase();
    const checkInISO = String(data?.checkInISO || "");
    const checkOutISO = String(data?.checkOutISO || "");

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(roomId, "invalid-argument", "roomId requerido");
    assert(fullName.length >= 3, "invalid-argument", "fullName inválido");
    assert(/^\S+@\S+\.\S+$/.test(email), "invalid-argument", "email inválido");
    assert(checkInISO && checkOutISO, "invalid-argument", "fechas requeridas");

    const checkIn = new Date(checkInISO);
    const checkOut = new Date(checkOutISO);
    assert(!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()), "invalid-argument", "fechas inválidas");

    const nightsArr = buildNights(checkIn, checkOut);
    assert(nightsArr.length > 0, "failed-precondition", "La estadía debe ser al menos 1 noche");

    const hostelRef = db.doc(`hostels/${hostelSlug}`);
    const roomRef = db.doc(`hostels/${hostelSlug}/rooms/${roomId}`);
    const reservationsCol = db.collection(`hostels/${hostelSlug}/reservations`);
    const roomNightsCol = db.collection(`hostels/${hostelSlug}/room_nights`);

    const reservationRef = reservationsCol.doc();

    const result = await db.runTransaction(async (tx) => {
      const hostelSnap = await tx.get(hostelRef);
      assert(hostelSnap.exists, "not-found", "Hostel no existe");
      const hostelData = hostelSnap.data() as any;
      const hostelName = String(hostelData?.name || hostelSlug);

      const roomSnap = await tx.get(roomRef);
      assert(roomSnap.exists, "not-found", "Habitación no existe");
      const roomData = roomSnap.data() as any;

      const roomName = String(roomData?.name || "Room");
      const pricePerNight = Number(roomData?.price || 0);
      assert(Number.isFinite(pricePerNight) && pricePerNight >= 0, "failed-precondition", "Precio inválido");

      // 1) verificar locks
      for (const yyyyMMdd of nightsArr) {
        const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
        const lockSnap = await tx.get(lockRef);
        if (lockSnap.exists) {
          throw new HttpsError("already-exists", "Fechas no disponibles");
        }
      }

      // 2) crear locks
      for (const yyyyMMdd of nightsArr) {
        const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
        tx.set(lockRef, {
          hostelSlug,
          roomId,
          date: yyyyMMdd,
          reservationId: reservationRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const nights = nightsArr.length;
      const total = pricePerNight * nights;

      // 3) crear reserva (pending)
      tx.set(reservationRef, {
        roomId,
        roomName,
        pricePerNight,
        checkIn: admin.firestore.Timestamp.fromDate(checkIn),
        checkOut: admin.firestore.Timestamp.fromDate(checkOut),
        nights,
        total,
        fullName,
        email,
        status: "pending" as ReservationStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "PUBLIC_WEB",
      });

      return { reservationId: reservationRef.id, hostelName, roomName, nights, total };
    });

    // mail (fuera de tx) — ✅ NO rompe reserva
    const checkInStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkIn));
    const checkOutStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkOut));

    /**
     * ✅ ESTO ES LO QUE ME PEDISTE
     * Va ACÁ: después de crear la reserva (fuera de la transacción)
     */
    await sendEmailBrevoSafe({
      to: email,
      toName: fullName,
      subject: `Recibimos tu reserva - ${result.hostelName}`,
      html: reservationEmailHtml({
        title: "Reserva recibida",
        hostelName: result.hostelName,
        roomName: result.roomName,
        fullName,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights: result.nights,
        total: result.total,
        status: "RECIBIDA",
      }),
    });

    return { ok: true, reservationId: result.reservationId };
  }
);

/**
 * setReservationStatus (ADMIN)
 * data: { hostelSlug, reservationId, newStatus }
 */
export const setReservationStatus = onCall(
  {
    region: "us-central1",
    secrets: [BREVO_API_KEY],
    enforceAppCheck: true,
    // (después con App Check lo vamos a poner también acá)
  },
  async (req) => {
    const data = req.data as {
      hostelSlug?: string;
      reservationId?: string;
      newStatus?: string;
    };

    // 1) exigir login
    assert(req.auth, "unauthenticated", "Requiere login");

    const uid = req.auth!.uid;

    const hostelSlug = String(data?.hostelSlug || "").trim();
    const reservationId = String(data?.reservationId || "").trim();
    const newStatusRaw = String(data?.newStatus || "").trim();

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(reservationId, "invalid-argument", "reservationId requerido");
    assert(newStatusRaw, "invalid-argument", "newStatus requerido");
    assert(isValidStatus(newStatusRaw), "invalid-argument", "newStatus inválido");

    const newStatus = newStatusRaw as ReservationStatus;

    // 2) validar admin del hostel (igual que cancelReservation)
    const userSnap = await db.doc(`users/${uid}`).get();
    assert(userSnap.exists, "permission-denied", "No autorizado");

    const userData = userSnap.data() as any;
    assert(userData?.role === "admin", "permission-denied", "No autorizado");
    assert(userData?.hostelSlug === hostelSlug, "permission-denied", "No autorizado para este hostel");

    // 3) update status
    const resRef = db.doc(`hostels/${hostelSlug}/reservations/${reservationId}`);

    const snap = await resRef.get();
    assert(snap.exists, "not-found", "Reserva no existe");

    const current = (snap.data()?.status ?? "pending") as ReservationStatus;
    assert(canTransition(current, newStatus), "failed-precondition", `No se puede pasar de ${current} a ${newStatus}`);

    await resRef.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    // 4) mail best-effort
    const email = String(snap.data()?.email || "");
    const fullName = String(snap.data()?.fullName || "");
    const roomName = String(snap.data()?.roomName || "");
    const nights = Number(snap.data()?.nights || 0);
    const total = Number(snap.data()?.total || 0);
    const checkInDate = snap.data()?.checkIn?.toDate?.();
    const checkOutDate = snap.data()?.checkOut?.toDate?.();

    if (email) {
      const checkInStr = checkInDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkInDate)) : "—";
      const checkOutStr = checkOutDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkOutDate)) : "—";

      await sendEmailBrevoSafe({
        to: email,
        toName: fullName,
        subject: `Estado de tu reserva - ${hostelSlug}`,
        html: reservationEmailHtml({
          title: "Actualización de reserva",
          hostelName: hostelSlug,
          roomName,
          fullName,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          nights,
          total,
          status: newStatus.toUpperCase(),
        }),
      });
    }

    return { ok: true };
  }
);
/**
 * cancelReservation (ADMIN)
 * data: { hostelSlug, reservationId }
 */
export const cancelReservation = onCall(
  {
    region: "us-central1",
    secrets: [BREVO_API_KEY],
    enforceAppCheck: true,
    
  },
  async (request) => {
    const data = request.data as any;
    const auth = request.auth;

    assert(auth, "unauthenticated", "Requiere login");

    const uid = auth!.uid;
    const hostelSlug = String(data?.hostelSlug || "").trim();
    const reservationId = String(data?.reservationId || "").trim();

    assert(hostelSlug && reservationId, "invalid-argument", "Parámetros requeridos");

    // validar admin
    const userSnap = await db.doc(`users/${uid}`).get();
    const userData = userSnap.data() as any;
    assert(userData?.role === "admin", "permission-denied", "No autorizado");
    assert(userData?.hostelSlug === hostelSlug, "permission-denied", "No autorizado para este hostel");

    const resRef = db.doc(`hostels/${hostelSlug}/reservations/${reservationId}`);
    const roomNightsCol = db.collection(`hostels/${hostelSlug}/room_nights`);

    const result = await db.runTransaction(async (tx) => {
      const resSnap = await tx.get(resRef);
      assert(resSnap.exists, "not-found", "Reserva no existe");

      const res = resSnap.data() as any;

      const currentStatus = String(res?.status || "pending") as ReservationStatus;
      if (currentStatus === "cancelled") return res;

      const roomId = String(res?.roomId || "");
      const checkInDate = res?.checkIn?.toDate?.();
      const checkOutDate = res?.checkOut?.toDate?.();

      if (roomId && checkInDate && checkOutDate) {
        const nightsArr = buildNights(checkInDate as Date, checkOutDate as Date);
        for (const yyyyMMdd of nightsArr) {
          const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
          tx.delete(lockRef);
        }
      }

      tx.set(
        resRef,
        {
          status: "cancelled" as ReservationStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );

      return res;
    });

    const email = String(result?.email || "");
    const fullName = String(result?.fullName || "");
    const roomName = String(result?.roomName || "");
    const nights = Number(result?.nights || 0);
    const total = Number(result?.total || 0);

    const checkInDate = result?.checkIn?.toDate?.();
    const checkOutDate = result?.checkOut?.toDate?.();

    // mail best-effort
    if (email) {
      const checkInStr = checkInDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkInDate)) : "—";
      const checkOutStr = checkOutDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkOutDate)) : "—";

      await sendEmailBrevoSafe({
        to: email,
        toName: fullName,
        subject: `Reserva cancelada - ${hostelSlug}`,
        html: reservationEmailHtml({
          title: "Reserva cancelada",
          hostelName: hostelSlug,
          roomName,
          fullName,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          nights,
          total,
          status: "CANCELADA",
        }),
      });
    }

    return { ok: true };
  }
);