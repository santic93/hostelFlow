import { httpsCallable } from "firebase/functions";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
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

export async function removeMember(hostelSlug: string, uid: string) {
  // OJO: rules niegan delete desde cliente.
  // Esto lo dejamos preparado para cuando hagamos "removeMember" en Functions.
  await deleteDoc(doc(db, "hostels", hostelSlug, "members", uid));
}