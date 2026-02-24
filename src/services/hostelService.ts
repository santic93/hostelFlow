import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";

export const getOrCreateHostel = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data().hostelSlug;
    }

    const slug = user.email!.split("@")[0].toLowerCase();

    await setDoc(doc(db, "hostels", slug), {
        name: slug,
        ownerUid: user.uid,
        createdAt: new Date(),
    });

    await setDoc(userRef, {
        role: "admin",
        hostelSlug: slug,
    });

    return slug;
};