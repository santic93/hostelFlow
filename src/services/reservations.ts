import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type CreateReservationInput = {
  hostelSlug: string;
  roomId: string;
  checkInISO: string;
  checkOutISO: string;
  fullName: string;
  email: string;
};

export async function createReservation(input: CreateReservationInput) {
  const fn = httpsCallable(functions, "createReservation");
  const res = await fn(input);
  return res.data as { ok: boolean; reservationId: string };
}

export async function setReservationStatus(input: {
  hostelSlug: string;
  reservationId: string;
  newStatus: ReservationStatus;
}) {
  const fn = httpsCallable(functions, "setReservationStatus");
  const res = await fn(input);
  return res.data as { ok: boolean };
}

export async function cancelReservation(input: { hostelSlug: string; reservationId: string }) {
  const fn = httpsCallable(functions, "cancelReservation");
  const res = await fn(input);
  return res.data as { ok: boolean };
}