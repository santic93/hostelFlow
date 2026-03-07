import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { admin, db } from "./admin";

type MemberRole = "owner" | "manager" | "staff";
type ReservationStatus = "pending" | "confirmed" | "cancelled";

async function requireRoomAdmin(hostelSlug: string, uid: string): Promise<MemberRole> {
  const memberRef = db.doc(`hostels/${hostelSlug}/members/${uid}`);
  const snap = await memberRef.get();

  if (!snap.exists) {
    throw new HttpsError("permission-denied", "No sos miembro de este hostel.");
  }

  const role = String(snap.data()?.role || "") as MemberRole;

  if (role !== "owner") {
    throw new HttpsError("permission-denied", "Solo el owner puede crear, editar o eliminar habitaciones.");
  }

  return role;
}

function normalizeRoomPayload(data: any) {
  return {
    name: String(data?.name ?? "").trim(),
    price: Number(data?.price ?? 0),
    capacity: Number(data?.capacity ?? 1),
    description: String(data?.description ?? "").trim(),
    imageUrls: Array.isArray(data?.imageUrls)
      ? data.imageUrls.filter((x: unknown) => typeof x === "string" && x.trim().length > 0)
      : [],
    imagePaths: Array.isArray(data?.imagePaths)
      ? data.imagePaths.filter((x: unknown) => typeof x === "string" && x.trim().length > 0)
      : [],
  };
}

function validateRoomPayload(payload: {
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
  imagePaths: string[];
}) {
  if (!payload.name || payload.name.length < 2) {
    throw new HttpsError("invalid-argument", "El nombre de la habitación es inválido.");
  }

  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    throw new HttpsError("invalid-argument", "El precio es inválido.");
  }

  if (!Number.isFinite(payload.capacity) || payload.capacity < 1) {
    throw new HttpsError("invalid-argument", "La capacidad es inválida.");
  }

  if (payload.imageUrls.length !== payload.imagePaths.length) {
    throw new HttpsError("invalid-argument", "Las imágenes están inconsistentes.");
  }

  if (payload.imageUrls.length > 6 || payload.imagePaths.length > 6) {
    throw new HttpsError("invalid-argument", "Máximo 6 imágenes por habitación.");
  }
}

async function deleteStorageFileByPath(path: string) {
  if (!path) return;

  try {
    await admin.storage().bucket().file(path).delete({ ignoreNotFound: true });
  } catch (err: any) {
    logger.warn("Storage delete failed", {
      path,
      message: err?.message,
    });
  }
}

function isActiveReservationStatus(status: string): status is ReservationStatus {
  return status === "pending" || status === "confirmed" || status === "cancelled";
}

function isFutureReservation(reservation: any) {
  const status = String(reservation?.status || "");
  if (!isActiveReservationStatus(status)) return false;
  if (status === "cancelled") return false;

  const checkOutDate = reservation?.checkOut?.toDate?.();
  if (!checkOutDate) return false;

  return checkOutDate.getTime() > Date.now();
}

export const adminCreateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "No autenticado.");
    }

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    if (!hostelSlug) {
      throw new HttpsError("invalid-argument", "Falta hostelSlug.");
    }

    await requireRoomAdmin(hostelSlug, uid);

    const payload = normalizeRoomPayload(req.data);
    validateRoomPayload(payload);

    const now = admin.firestore.FieldValue.serverTimestamp();

    const ref = await db.collection(`hostels/${hostelSlug}/rooms`).add({
      ...payload,
      createdAt: now,
      updatedAt: now,
    });

    logger.info("Room created", {
      hostelSlug,
      roomId: ref.id,
      uid,
    });

    return {
      ok: true,
      roomId: ref.id,
    };
  }
);

export const adminUpdateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "No autenticado.");
    }

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const roomId = String(req.data?.roomId || "").trim();

    if (!hostelSlug || !roomId) {
      throw new HttpsError("invalid-argument", "Falta hostelSlug o roomId.");
    }

    await requireRoomAdmin(hostelSlug, uid);

    const roomRef = db.doc(`hostels/${hostelSlug}/rooms/${roomId}`);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      throw new HttpsError("not-found", "La habitación no existe.");
    }

    const payload = normalizeRoomPayload(req.data);
    validateRoomPayload(payload);

    await roomRef.set(
      {
        ...payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("Room updated", {
      hostelSlug,
      roomId,
      uid,
    });

    return { ok: true };
  }
);

export const adminDeleteRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "No autenticado.");
    }

    const hostelSlug = String(req.data?.hostelSlug || "").trim();
    const roomId = String(req.data?.roomId || "").trim();

    if (!hostelSlug || !roomId) {
      throw new HttpsError("invalid-argument", "Falta hostelSlug o roomId.");
    }

    await requireRoomAdmin(hostelSlug, uid);

    const roomRef = db.doc(`hostels/${hostelSlug}/rooms/${roomId}`);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      throw new HttpsError("not-found", "La habitación no existe.");
    }

    const roomData = roomSnap.data() as any;
    const imagePaths: string[] = Array.isArray(roomData?.imagePaths) ? roomData.imagePaths : [];

    const reservationsSnap = await db
      .collection(`hostels/${hostelSlug}/reservations`)
      .where("roomId", "==", roomId)
      .get();

    const hasFutureReservations = reservationsSnap.docs.some((docSnap) => {
      const reservation = docSnap.data() as any;
      return isFutureReservation(reservation);
    });

    if (hasFutureReservations) {
      throw new HttpsError(
        "failed-precondition",
        "No se puede eliminar la habitación porque tiene reservas futuras activas."
      );
    }

    await roomRef.delete();

    if (imagePaths.length) {
      await Promise.allSettled(imagePaths.map((path) => deleteStorageFileByPath(path)));
    }

    logger.info("Room deleted", {
      hostelSlug,
      roomId,
      uid,
      imagesDeleted: imagePaths.length,
    });

    return { ok: true };
  }
);