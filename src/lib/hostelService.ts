import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const getOrCreateHostel = async (user: any) => {
  const q = query(
    collection(db, "hostels"),
    where("ownerUid", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id; // hostelSlug
  }

  // Crear slug simple basado en email
  const slug = user.email.split("@")[0];

  await setDoc(doc(db, "hostels", slug), {
    name: slug,
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
  });

  return slug;
};