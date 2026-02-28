import { httpsCallable } from "firebase/functions";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, functions } from "./firebase";

export type MemberRole = "owner" | "manager" | "staff";

export function inviteMember(payload: { hostelSlug: string; email: string; role: MemberRole }) {
  return httpsCallable(functions, "inviteMember")(payload);
}

export async function listMembers(hostelSlug: string) {
  const q = query(collection(db, "hostels", hostelSlug, "members"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function removeMember(hostelSlug: string, targetUid: string) {
  const fn = httpsCallable(functions, "removeMember");
  const res = await fn({ hostelSlug, targetUid });
  return res.data as { ok: boolean };
}