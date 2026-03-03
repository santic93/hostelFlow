import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";
import * as logger from "firebase-functions/logger";

type Role = "owner" | "manager" | "staff" | "guest";

async function requireOwner(hostelSlug: string, uid: string) {
  const memberRef = db.doc(`hostels/${hostelSlug}/members/${uid}`);
  const snap = await memberRef.get();
  const role = (snap.exists ? (snap.data()?.role as Role) : "guest") || "guest";

  if (role !== "owner") {
    throw new HttpsError("permission-denied", "Solo el owner puede crear/editar habitaciones.");
  }
}

export const adminCreateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "No autenticado.");

    const { hostelSlug, name, price, capacity, description, imageUrls, imagePaths } = req.data || {};
    if (!hostelSlug) throw new HttpsError("invalid-argument", "Falta hostelSlug.");

    await requireOwner(String(hostelSlug), uid);

    const payload = {
      name: String(name ?? "").trim(),
      price: Number(price ?? 0),
      capacity: Number(capacity ?? 1),
      description: String(description ?? ""),
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      imagePaths: Array.isArray(imagePaths) ? imagePaths : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!payload.name || payload.price <= 0 || payload.capacity < 1) {
      throw new HttpsError("invalid-argument", "Datos inválidos.");
    }

    const ref = await db.collection(`hostels/${hostelSlug}/rooms`).add(payload);
    logger.info("Room created", { hostelSlug, roomId: ref.id, uid });

    return { roomId: ref.id };
  }
);

export const adminUpdateRoom = onCall(
  { region: "us-central1", enforceAppCheck: true },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "No autenticado.");

    const { hostelSlug, roomId, name, price, capacity, description, imageUrls, imagePaths } = req.data || {};
    if (!hostelSlug || !roomId) throw new HttpsError("invalid-argument", "Falta hostelSlug/roomId.");

    await requireOwner(String(hostelSlug), uid);

    const payload = {
      name: String(name ?? "").trim(),
      price: Number(price ?? 0),
      capacity: Number(capacity ?? 1),
      description: String(description ?? ""),
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      imagePaths: Array.isArray(imagePaths) ? imagePaths : [],
      updatedAt: new Date(),
    };

    if (!payload.name || payload.price <= 0 || payload.capacity < 1) {
      throw new HttpsError("invalid-argument", "Datos inválidos.");
    }

    await db.doc(`hostels/${hostelSlug}/rooms/${roomId}`).set(payload, { merge: true });
    logger.info("Room updated", { hostelSlug, roomId, uid });

    return { ok: true };
  }
);