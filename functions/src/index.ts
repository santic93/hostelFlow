
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

// -------------------- Params / Secrets
const MAIL_FROM_EMAIL = defineString("MAIL_FROM_EMAIL", { default: "no-reply@hostly.app" });
const MAIL_FROM_NAME = defineString("MAIL_FROM_NAME", { default: "Hostly" });

/**
 * SECRET (Brevo API Key)
 * firebase functions:secrets:set BREVO_API_KEY
 */
const BREVO_API_KEY = defineSecret("BREVO_API_KEY");

// -------------------- Helpers
function assert(condition: any, code: any, message: string) {
  if (!condition) throw new HttpsError(code, message);
}

type MemberRole = "owner" | "manager" | "staff";
type ReservationStatus = "pending" | "confirmed" | "cancelled";

function isValidMemberRole(r: string): r is MemberRole {
  return r === "owner" || r === "manager" || r === "staff";
}
function isValidStatus(s: string): s is ReservationStatus {
  return s === "pending" || s === "confirmed" || s === "cancelled";
}
function canTransition(from: ReservationStatus, to: ReservationStatus) {
  if (from === "cancelled") return false;
  return true;
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

// -------------------- Membership (RBAC)
async function requireMemberRole(
  uid: string,
  hostelSlug: string,
  allowed: MemberRole[]
): Promise<{ role: MemberRole }> {
  const ref = db.doc(`hostels/${hostelSlug}/members/${uid}`);
  const snap = await ref.get();
  assert(snap.exists, "permission-denied", "No sos miembro de este hostel");
  const role = String(snap.data()?.role || "");
  assert(isValidMemberRole(role), "permission-denied", "Rol inválido");
  assert(allowed.includes(role as MemberRole), "permission-denied", "No autorizado");
  return { role: role as MemberRole };
}

// -------------------- Email
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
    <h2>${title}</h2>
    <p>Hola ${fullName},</p>
    <p>Tu reserva en <b>${hostelName.toUpperCase()}</b> está: <b>${status}</b>.</p>
    <ul>
      <li>Habitación: ${roomName}</li>
      <li>Check-in: ${checkIn}</li>
      <li>Check-out: ${checkOut}</li>
      <li>Noches: ${nights}</li>
      <li>Total: $${total}</li>
    </ul>
    <p>Si necesitás modificar o cancelar, contactá al hostel.</p>
  `;
}

async function sendEmailBrevo(args: { to: string; toName?: string; subject: string; html: string }) {
  const apiKey = BREVO_API_KEY.value();
  if (!apiKey) {
    console.warn("BREVO_API_KEY not set. Skipping email.");
    return { ok: false as const, skipped: true as const };
  }

  const res = await axios.post(
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

  return { ok: true as const, providerResponse: res.data };
}

async function logEmail(args: {
  hostelSlug: string;
  kind: "reservation_created" | "reservation_status" | "reservation_cancelled" | "invite_member";
  to: string;
  subject: string;
  ok: boolean;
  meta?: Record<string, any>;
  provider?: "brevo";
  providerResponse?: any;
  error?: any;
}) {
  const ref = db.collection(`hostels/${args.hostelSlug}/email_logs`).doc();
  await ref.set({
    kind: args.kind,
    to: args.to,
    subject: args.subject,
    ok: args.ok,
    provider: args.provider ?? "brevo",
    providerResponse: args.providerResponse ?? null,
    error: args.error ? String(args.error?.message ?? args.error) : null,
    meta: args.meta ?? {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function sendEmailBrevoSafe(args: {
  hostelSlug: string;
  kind: "reservation_created" | "reservation_status" | "reservation_cancelled" | "invite_member";
  to: string;
  toName?: string;
  subject: string;
  html: string;
  meta?: Record<string, any>;
}) {
  try {
    const r = await sendEmailBrevo({ to: args.to, toName: args.toName, subject: args.subject, html: args.html });
    await logEmail({
      hostelSlug: args.hostelSlug,
      kind: args.kind,
      to: args.to,
      subject: args.subject,
      ok: !!r.ok,
      provider: "brevo",
      providerResponse: (r as any).providerResponse ?? null,
      meta: args.meta,
    });
  } catch (err: any) {
    console.error("Email send failed (NOT blocking main flow).", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    await logEmail({
      hostelSlug: args.hostelSlug,
      kind: args.kind,
      to: args.to,
      subject: args.subject,
      ok: false,
      provider: "brevo",
      error: err,
      meta: args.meta,
      providerResponse: err?.response?.data ?? null,
    });
  }
}

// -------------------- FUNCTIONS

/**
 * inviteMember (MANAGER+)
 * data: { hostelSlug, email, role }
 */
export const inviteMember = onCall(
  { region: "us-central1", secrets: [BREVO_API_KEY], enforceAppCheck: true },
  async (req) => {
    assert(req.auth, "unauthenticated", "Requiere login");
    const uid = req.auth!.uid;

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const email = String(req.data?.email || "").trim().toLowerCase();
    const roleRaw = String(req.data?.role || "").trim();

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(/^\S+@\S+\.\S+$/.test(email), "invalid-argument", "email inválido");
    assert(isValidMemberRole(roleRaw), "invalid-argument", "role inválido");

    await requireMemberRole(uid, hostelSlug, ["owner", "manager"]);

    const targetUser = await admin.auth().getUserByEmail(email).catch(() => null);
    assert(targetUser, "not-found", "No existe usuario con ese email (primero debe registrarse)");

    const targetUid = targetUser!.uid;

    const memberRef = db.doc(`hostels/${hostelSlug}/members/${targetUid}`);
    await memberRef.set(
      {
        role: roleRaw,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
      },
      { merge: true }
    );

    // Bootstrap user doc mínimo (si no existe)
    const userRef = db.doc(`users/${targetUid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        email,
        activeHostelSlug: hostelSlug,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // si no tenía activeHostelSlug, setearlo (no pisar si ya tiene)
      const data = userSnap.data() as any;
      if (!data?.activeHostelSlug && !data?.hostelSlug) {
        await userRef.set({ activeHostelSlug: hostelSlug }, { merge: true });
      }
    }

    await sendEmailBrevoSafe({
      hostelSlug,
      kind: "invite_member",
      to: email,
      subject: `Te invitaron a colaborar en ${hostelSlug}`,
      html: `<p>Te agregaron como <b>${roleRaw}</b> en el hostel <b>${hostelSlug}</b>.</p><p>Entrá y andá a /${hostelSlug}/admin</p>`,
      meta: { role: roleRaw, invitedUid: targetUid },
    });

    return { ok: true };
  }
);

/**
 * createReservation (PUBLIC)
 * data: { hostelSlug, roomId, checkInISO, checkOutISO, fullName, email }
 */
export const createReservation = onCall(
  { region: "us-central1", secrets: [BREVO_API_KEY], enforceAppCheck: true },
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

      // locks
      for (const yyyyMMdd of nightsArr) {
        const lockRef = roomNightsCol.doc(lockDocId(roomId, yyyyMMdd));
        const lockSnap = await tx.get(lockRef);
        if (lockSnap.exists) throw new HttpsError("already-exists", "Fechas no disponibles");
      }
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

    // email best-effort
    const checkInStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkIn));
    const checkOutStr = formatYYYYMMDD_UTC(toUTCDateOnly(checkOut));

    await sendEmailBrevoSafe({
      hostelSlug,
      kind: "reservation_created",
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
      meta: { reservationId: result.reservationId },
    });

    return { ok: true, reservationId: result.reservationId };
  }
);

/**
 * setReservationStatus (STAFF+)
 * data: { hostelSlug, reservationId, newStatus }
 */
export const setReservationStatus = onCall(
  { region: "us-central1", secrets: [BREVO_API_KEY], enforceAppCheck: true },
  async (req) => {
    assert(req.auth, "unauthenticated", "Requiere login");
    const uid = req.auth!.uid;

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const reservationId = String(req.data?.reservationId || "").trim();
    const newStatusRaw = String(req.data?.newStatus || "").trim();

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(reservationId, "invalid-argument", "reservationId requerido");
    assert(isValidStatus(newStatusRaw), "invalid-argument", "newStatus inválido");

    const newStatus = newStatusRaw as ReservationStatus;

    await requireMemberRole(uid, hostelSlug, ["owner", "manager", "staff"]);

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

    // email best-effort
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
        hostelSlug,
        kind: "reservation_status",
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
        meta: { reservationId, from: current, to: newStatus },
      });
    }

    return { ok: true };
  }
);

/**
 * cancelReservation (MANAGER+)
 * data: { hostelSlug, reservationId }
 */
export const cancelReservation = onCall(
  { region: "us-central1", secrets: [BREVO_API_KEY], enforceAppCheck: true },
  async (request) => {
    assert(request.auth, "unauthenticated", "Requiere login");
    const uid = request.auth!.uid;

    const hostelSlug = String(request.data?.hostelSlug || "").trim();
    const reservationId = String(request.data?.reservationId || "").trim();

    assert(hostelSlug && reservationId, "invalid-argument", "Parámetros requeridos");

    await requireMemberRole(uid, hostelSlug, ["owner", "manager"]);

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

    if (email) {
      const checkInStr = checkInDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkInDate)) : "—";
      const checkOutStr = checkOutDate ? formatYYYYMMDD_UTC(toUTCDateOnly(checkOutDate)) : "—";

      await sendEmailBrevoSafe({
        hostelSlug,
        kind: "reservation_cancelled",
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
        meta: { reservationId },
      });
    }

    return { ok: true };
  }
);