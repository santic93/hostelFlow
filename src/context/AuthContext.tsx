// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { getOrCreateHostel } from "../services/hostelService";


type Role = "admin" | "guest";

type AuthContextType = {
  user: User | null;
  hostelSlug: string | null;   // SOLO para admin
  role: Role;
  loading: boolean;   
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  hostelSlug: null,
  role: "guest",
  loading: true,
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [hostelSlug, setHostelSlug] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true);

    if (!firebaseUser) {
      setUser(null);
      setHostelSlug(null);
      setRole("guest");
      setLoading(false);
      return;
    }

    setUser(firebaseUser);

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    // Si no existe perfil -> lo creo como guest por default
    if (!snap.exists()) {
      await setDoc(userRef, { role: "guest" }, { merge: true });
      setRole("guest");
      setHostelSlug(null);
      setLoading(false);
      return;
    }

    const data = snap.data() as any;
    const nextRole: Role = data?.role === "admin" ? "admin" : "guest";
    setRole(nextRole);

    if (nextRole === "admin") {
      // el admin debe tener hostelSlug
      let slug: string | null = data?.hostelSlug ?? null;

      if (!slug) {
        // solo si no existe lo creo/asigno
        slug = await getOrCreateHostel(firebaseUser);
        await setDoc(userRef, { hostelSlug: slug }, { merge: true });
      }

      setHostelSlug(slug);
    } else {
      setHostelSlug(null);
    }

    setLoading(false);
  });

  return unsubscribe;
}, []);
  return (
    <AuthContext.Provider value={{ user, hostelSlug, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);