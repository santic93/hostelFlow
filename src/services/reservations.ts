import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type PublicRoom = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
};

export type CreateReservationInput = {
  hostelSlug: string;
  roomId: string;
  checkInISO: string;
  checkOutISO: string;
  fullName: string;
  email: string;
};

export type CreateReservationResponse = {
  ok: boolean;
  reservationId: string;
  rid?: string;
};

export async function createReservation(input: CreateReservationInput) {
  const fn = httpsCallable<CreateReservationInput, CreateReservationResponse>(
    functions,
    "createReservation"
  );
  const res = await fn(input);
  return res.data;
}

export type SetReservationStatusInput = {
  hostelSlug: string;
  reservationId: string;
  newStatus: ReservationStatus;
};

export type BasicCallableOkResponse = {
  ok: boolean;
  rid?: string;
};

export async function setReservationStatus(input: SetReservationStatusInput) {
  const fn = httpsCallable<SetReservationStatusInput, BasicCallableOkResponse>(
    functions,
    "setReservationStatus"
  );
  const res = await fn(input);
  return res.data;
}

export type CancelReservationInput = {
  hostelSlug: string;
  reservationId: string;
};

export async function cancelReservation(input: CancelReservationInput) {
  const fn = httpsCallable<CancelReservationInput, BasicCallableOkResponse>(
    functions,
    "cancelReservation"
  );
  const res = await fn(input);
  return res.data;
}

export type GetRoomAvailabilityInput = {
  hostelSlug: string;
  roomId: string;
  from: string;
  to: string;
};

export type GetRoomAvailabilityResponse = {
  ok: boolean;
  dates: string[];
  buildingIndex?: boolean;
  rid?: string;
};

export async function getRoomAvailability(input: GetRoomAvailabilityInput) {
  const fn = httpsCallable<
    GetRoomAvailabilityInput,
    GetRoomAvailabilityResponse
  >(functions, "getRoomAvailability");

  const res = await fn(input);
  return res.data;
}