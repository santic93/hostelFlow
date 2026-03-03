import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";

const db = admin.firestore();

function requireAuth(req: CallableRequest<any>) {
  if (!req.auth) throw new HttpsError("unauthenticated", "Requiere login");
  return req.auth;
}

type MemberRole = "owner" | "manager" | "staff";
function isValidMemberRole(r: string): r is MemberRole {
  return r === "owner" || r === "manager" || r === "staff";
}

async function requireOwner(uid: string, hostelSlug: string) {
  const ref = db.doc(`hostels/${hostelSlug}/members/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("permission-denied", "No sos miembro de este hostel");
  const role = String(snap.data()?.role || "");
  if (!isValidMemberRole(role)) throw new HttpsError("permission-denied", "Rol inválido");
  if (role !== "owner") throw new HttpsError("permission-denied", "Solo el owner puede administrar habitaciones");
}

function isNonEmptyString(v: any, minLen: number) {
  return typeof v === "string" && v.trim().length >= minLen;
}

function assert(cond: any, code: any, msg: string) {
  if (!cond) throw new HttpsError(code, msg);
}

// -------------------- CREATE
export const adminCreateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const auth = requireAuth(req);
    const uid = auth.uid;

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");

    await requireOwner(uid, hostelSlug);

    const name = String(req.data?.name || "").trim();
    const description = String(req.data?.description || "").trim();
    const price = Number(req.data?.price || 0);
    const capacity = Number(req.data?.capacity || 0);

    const imageUrls: string[] = Array.isArray(req.data?.imageUrls) ? req.data.imageUrls : [];
    const imagePaths: string[] = Array.isArray(req.data?.imagePaths) ? req.data.imagePaths : [];

    assert(isNonEmptyString(name, 2), "invalid-argument", "name requerido");
    assert(Number.isFinite(price) && price > 0, "invalid-argument", "price inválido");
    assert(Number.isFinite(capacity) && capacity >= 1, "invalid-argument", "capacity inválida");

    const ref = db.collection(`hostels/${hostelSlug}/rooms`).doc();
    await ref.set({
      name,
      description,
      price,
      capacity,
      imageUrls,
      imagePaths,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    return { ok: true, roomId: ref.id };
  }
);

// -------------------- UPDATE
export const adminUpdateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const auth = requireAuth(req);
    const uid = auth.uid;

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const roomId = String(req.data?.roomId || "").trim();

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(roomId, "invalid-argument", "roomId requerido");

    await requireOwner(uid, hostelSlug);

    const name = String(req.data?.name || "").trim();
    const description = String(req.data?.description || "").trim();
    const price = Number(req.data?.price || 0);
    const capacity = Number(req.data?.capacity || 0);

    const imageUrls: string[] = Array.isArray(req.data?.imageUrls) ? req.data.imageUrls : [];
    const imagePaths: string[] = Array.isArray(req.data?.imagePaths) ? req.data.imagePaths : [];

    assert(isNonEmptyString(name, 2), "invalid-argument", "name requerido");
    assert(Number.isFinite(price) && price > 0, "invalid-argument", "price inválido");
    assert(Number.isFinite(capacity) && capacity >= 1, "invalid-argument", "capacity inválida");

    const ref = db.doc(`hostels/${hostelSlug}/rooms/${roomId}`);
    const snap = await ref.get();
    assert(snap.exists, "not-found", "Habitación no existe");

    await ref.update({
      name,
      description,
      price,
      capacity,
      imageUrls,
      imagePaths,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    return { ok: true };
  }
);

// -------------------- DELETE (SOLO borra doc, NO borra Storage)
export const adminDeleteRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const auth = requireAuth(req);
    const uid = auth.uid;

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const roomId = String(req.data?.roomId || "").trim();

    assert(hostelSlug, "invalid-argument", "hostelSlug requerido");
    assert(roomId, "invalid-argument", "roomId requerido");

    await requireOwner(uid, hostelSlug);

    const ref = db.doc(`hostels/${hostelSlug}/rooms/${roomId}`);
    const snap = await ref.get();
    assert(snap.exists, "not-found", "Habitación no existe");

    await ref.delete();

    return { ok: true };
  }
);