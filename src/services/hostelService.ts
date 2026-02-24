import type { User } from "firebase/auth";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Devuelve el hostelSlug del admin.
 * Si no existe, crea uno y crea el doc hostels/{slug}.
 * Importante: asume que ya decidiste que este user ES admin (lo llamás solo si role === "admin").
 */
export const getOrCreateHostel = async (user: User): Promise<string> => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // 1) Si el user doc existe y tiene hostelSlug => devolverlo
    const existingSlug = userSnap.exists() ? (userSnap.data() as any)?.hostelSlug : null;
    if (existingSlug) return existingSlug;

    // 2) base slug (fallback) - NO confiar 100% en email
    const emailBase = (user.email?.split("@")[0] ?? "hostel")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    // 3) Crear slug único + crear hostel en una transacción para evitar colisiones
    const finalSlug = await runTransaction(db, async (tx) => {
        // intentamos con emailBase, si existe, probamos con sufijos -2, -3, etc.
        let candidate = emailBase || "hostel";
        let i = 1;

        while (true) {
            const hostelRef = doc(db, "hostels", candidate);
            const hostelSnap = await tx.get(hostelRef);

            if (!hostelSnap.exists()) {
                // crear hostel
                tx.set(hostelRef, {
                    name: candidate,
                    slug: candidate,
                    ownerUid: user.uid,
                    createdAt: serverTimestamp(),
                });

                // actualizar user
                tx.set(
                    userRef,
                    { role: "admin", hostelSlug: candidate, updatedAt: serverTimestamp() },
                    { merge: true }
                );

                return candidate;
            }

            // si existe, verifico si ya es de este owner (por si lo creó antes)
            const data = hostelSnap.data() as any;
            if (data?.ownerUid === user.uid) {
                tx.set(
                    userRef,
                    { role: "admin", hostelSlug: candidate, updatedAt: serverTimestamp() },
                    { merge: true }
                );
                return candidate;
            }

            // si es de otro owner => siguiente candidato
            i += 1;
            candidate = `${emailBase || "hostel"}-${i}`;
        }
    });

    return finalSlug;
};