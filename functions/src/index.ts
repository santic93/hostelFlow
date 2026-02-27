import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// =========================
// SMTP config (Functions v1)
// firebase functions:config:set smtp.host="..." smtp.port="587" smtp.user="..." smtp.pass="..." smtp.from="Hostly <...>"
// =========================
const smtpHost = functions.config().smtp?.host as string | undefined;
const smtpPort = Number(functions.config().smtp?.port || 587);
const smtpUser = functions.config().smtp?.user as string | undefined;
const smtpPass = functions.config().smtp?.pass as string | undefined;
const smtpFrom = (functions.config().smtp?.from as string | undefined) || "Hostly <no-reply@hostly.app>";

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

function assert(condition: any, code: functions.https.FunctionsErrorCode, message: string) {
  if (!condition) throw new functions.https.HttpsError(code, message);
}

// ✅ Soluciona el problema TS Date | undefined (y además valida fecha real)
function requireDate(value: any, code: functions.https.FunctionsErrorCode, message: string): Date {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    throw new functions.https.HttpsError(code, message);
  }
  return value;
}

type ReservationStatus = "pending" | "confirmed" | "cancelled";

function isValidStatus(s: string): s is ReservationStatus {
  return s === "pending" || s === "confirmed" || s === "cancelled";
}

function canTransition(from: ReservationStatus, to: ReservationStatus) {
  if (from === to) return true;
  if (from === "pending" && (to === "confirmed" || to === "cancelled")) return true;
  if (from === "confirmed" && to === "cancelled") return true;
  return false; // cancelled terminal
}

function statusLabelEs(status: ReservationStatus) {
  if (status === "pending") return "PENDIENTE";
  if (status === "confirmed") return "CONFIRMADA";
  return "CANCELADA";
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

function buildNights(from: Date, to: Date) {
  const start = toUTCDateOnly(from);
  const end = toUTCDateOnly(to);

  const nights: string[] = [];
  for (let cur = new Date(start); cur < end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    nights.push(formatYYYYMMDD_UTC(cur));
  }
  return nights; // check-in inclusive, check-out exclusive
}

function lockDocId(roomId: string, yyyyMMdd: string) {
  return `${roomId}_${yyyyMMdd}`;
}

async function sendEmailSafe(to: string, subject: string, html: string) {
  if (!transporter) {
    console.warn("SMTP not configured. Skipping email to:", to, subject);
    return;
  }
  await transporter.sendMail({ from: smtpFrom, to, subject, html });
}

function emailTemplateBase(args: { title: string; bodyHtml: string; footer?: string }) {
  const footer =
    args.footer ?? "Si necesitás modificar o cancelar, respondé este email o contactá directamente al hostel.";
  return `
  <div style="font-family:Arial,sans-serif; line-height:1.55; max-width:620px; margin:0 auto; padding:16px;">
    <h2 style="margin:0 0 12px;">${args.title}</h2>
    <div style="color:#111;">${args.bodyHtml}</div>
    <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
    <p style="margin:0; color:#666; font-size:13px;">${footer}</p>
  </div>`;
}

function reservationDetailsListHtml(args: {
  hostelName: string;
  roomName: string;
  fullName: string;
  checkInStr: string;
  checkOutStr: string;
  nights: number;
  total: number;
}) {
  const { hostelName, roomName, fullName, checkInStr, checkOutStr, nights, total } = args;
  return `
    <p>Hola <b>${fullName}</b>,</p>
    <p>Reserva en <b>${hostelName}</b>:</p>
    <ul>
      <li><b>Habitación:</b> ${roomName}</li>
      <li><b>Check-in:</b> ${checkInStr}</li>
      <li><b>Check-out:</b> ${checkOutStr}</li>
      <li><b>Noches:</b> ${nights}</li>
      <li><b>Total:</b> $${total}</li>
    </ul>
  `;
}

// =====================================================
// 1) CREATE RESERVATION (PENDING) + LOCKS + MAIL "RECIBIDA"
// =====================================================
export const createReservation = functions.https.onCall(async (data, context) => {
  const hostelSlug = String(data?.hostelSlug || "");
  const roomId = String(data?.roomId || "");
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
  assert(checkOut > checkIn, "failed-precondition", "checkOut debe ser posterior a checkIn");

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
    assert(pricePerNight > 0, "failed-precondition", "Precio inválido");

    // 1) verificar locks
    for (const yyyyMMdd of nightsArr) {
      const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists) {
        throw new functions.https.HttpsError("already-exists", "Fechas no disponibles");
      }
    }

    // 2) crear locks (pending)
    for (const yyyyMMdd of nightsArr) {
      const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
      tx.set(lockRef, {
        hostelSlug,
        roomId,
        date: yyyyMMdd,
        reservationId: reservationRef.id,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const nights = nightsArr.length;
    const total = Math.round(pricePerNight * nights);

    // 3) crear reserva PENDING
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
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "PUBLIC_WEB",
    });

    return { reservationId: reservationRef.id, hostelName, roomName, nights, total };
  });

  // mail "recibida"
  const checkInStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkIn));
  const checkOutStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkOut));

  await sendEmailSafe(
    email,
    `Recibimos tu reserva - ${result.hostelName}`,
    emailTemplateBase({
      title: "¡Reserva recibida!",
      bodyHtml:
        `<p>Tu solicitud fue recibida y está <b>PENDIENTE</b> de confirmación por el hostel.</p>` +
        reservationDetailsListHtml({
          hostelName: result.hostelName,
          roomName: result.roomName,
          fullName,
          checkInStr,
          checkOutStr,
          nights: result.nights,
          total: result.total,
        }),
    })
  );

  return { ok: true, reservationId: result.reservationId };
});

// =====================================================
// Helper: aplicar cambio de estado (admin) + locks + mail
// =====================================================
async function applyStatusChange(args: {
  uid: string;
  hostelSlug: string;
  reservationId: string;
  newStatus: ReservationStatus;
}) {
  const { uid, hostelSlug, reservationId, newStatus } = args;

  // Validar admin del hostel
  const userSnap = await db.doc(`users/${uid}`).get();
  const userData = userSnap.data() as any;
  assert(userData?.role === "admin", "permission-denied", "No autorizado");
  assert(userData?.hostelSlug === hostelSlug, "permission-denied", "No autorizado para este hostel");

  const hostelRef = db.doc(`hostels/${hostelSlug}`);
  const resRef = db.doc(`hostels/${hostelSlug}/reservations/${reservationId}`);
  const roomNightsCol = db.collection(`hostels/${hostelSlug}/room_nights`);

  const updated = await db.runTransaction(async (tx) => {
    const hostelSnap = await tx.get(hostelRef);
    assert(hostelSnap.exists, "not-found", "Hostel no existe");
    const hostelName = String((hostelSnap.data() as any)?.name || hostelSlug);

    const resSnap = await tx.get(resRef);
    assert(resSnap.exists, "not-found", "Reserva no existe");
    const res = resSnap.data() as any;

    const prevStatus = String(res?.status || "") as ReservationStatus;
    assert(isValidStatus(prevStatus), "failed-precondition", "Estado actual inválido");
    assert(canTransition(prevStatus, newStatus), "failed-precondition", "Transición no permitida");

    const roomId = String(res?.roomId || "");
    const roomName = String(res?.roomName || "");
    const fullName = String(res?.fullName || "");
    const email = String(res?.email || "");
    const nights = Number(res?.nights || 0);
    const total = Number(res?.total || 0);

    const checkInRaw = res?.checkIn?.toDate?.();
    const checkOutRaw = res?.checkOut?.toDate?.();

    const checkInDate = requireDate(checkInRaw, "failed-precondition", "checkIn faltante o inválido");
    const checkOutDate = requireDate(checkOutRaw, "failed-precondition", "checkOut faltante o inválido");
    assert(checkOutDate > checkInDate, "failed-precondition", "Fechas inválidas (checkOut <= checkIn)");

    const nightsArr = buildNights(checkInDate, checkOutDate);

    if (newStatus === "cancelled") {
      // cancelar => borrar locks
      for (const yyyyMMdd of nightsArr) {
        tx.delete(roomNightsCol.doc(lockDocId(roomId, yyyyMMdd)));
      }
    } else if (newStatus === "confirmed") {
      // confirmar => marcar locks confirmados (auditoría)
      for (const yyyyMMdd of nightsArr) {
        tx.set(
          roomNightsCol.doc(lockDocId(roomId, yyyyMMdd)),
          { status: "confirmed", updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
    }

    tx.set(
      resRef,
      {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    const checkInStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkInDate));
    const checkOutStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkOutDate));

    return { hostelName, roomName, fullName, email, nights, total, checkInStr, checkOutStr, newStatus };
  });

  // Mail al huésped (afuera)
  if (updated.email) {
    const label = statusLabelEs(updated.newStatus);

    let intro = "";
    if (updated.newStatus === "confirmed") {
      intro = `<p>¡Buenas noticias! Tu reserva fue <b>${label}</b>. Te esperamos 😊</p>`;
    } else if (updated.newStatus === "cancelled") {
      intro = `<p>Tu reserva fue <b>${label}</b>. Si querés, podés responder este mail para reprogramarla.</p>`;
    } else {
      intro = `<p>Tu reserva está <b>${label}</b>.</p>`;
    }

    await sendEmailSafe(
      updated.email,
      `Tu reserva está ${label} - ${updated.hostelName}`,
      emailTemplateBase({
        title: `Estado de tu reserva: ${label}`,
        bodyHtml:
          intro +
          reservationDetailsListHtml({
            hostelName: updated.hostelName,
            roomName: updated.roomName,
            fullName: updated.fullName,
            checkInStr: updated.checkInStr,
            checkOutStr: updated.checkOutStr,
            nights: updated.nights,
            total: updated.total,
          }),
      })
    );
  }

  return { ok: true };
}

// =====================================================
// 2) SET STATUS (admin)
// =====================================================
export const setReservationStatus = functions.https.onCall(async (data, context) => {
  assert(context.auth, "unauthenticated", "Requiere login");

  const uid = context.auth!.uid;
  const hostelSlug = String(data?.hostelSlug || "");
  const reservationId = String(data?.reservationId || "");
  const newStatusRaw = String(data?.newStatus || "");

  assert(hostelSlug && reservationId && newStatusRaw, "invalid-argument", "Parámetros requeridos");
  assert(isValidStatus(newStatusRaw), "invalid-argument", "Estado inválido");

  return await applyStatusChange({
    uid,
    hostelSlug,
    reservationId,
    newStatus: newStatusRaw as ReservationStatus,
  });
});

// =====================================================
// 3) CANCEL (admin)
// =====================================================
export const cancelReservation = functions.https.onCall(async (data, context) => {
  assert(context.auth, "unauthenticated", "Requiere login");

  const uid = context.auth!.uid;
  const hostelSlug = String(data?.hostelSlug || "");
  const reservationId = String(data?.reservationId || "");

  assert(hostelSlug && reservationId, "invalid-argument", "Parámetros requeridos");

  return await applyStatusChange({
    uid,
    hostelSlug,
    reservationId,
    newStatus: "cancelled",
  });
});