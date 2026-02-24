// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
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
  let unsubscribeUserDoc: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
    // cada vez que cambia auth, limpiamos listener anterior
    if (unsubscribeUserDoc) {
      unsubscribeUserDoc();
      unsubscribeUserDoc = null;
    }

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

    // ✅ escucha en tiempo real el doc de perfil
    unsubscribeUserDoc = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          // perfil todavía no está creado (o no llegó)
          setRole("guest");
          setHostelSlug(null);
          setLoading(false);
          return;
        }

        const data = snap.data() as any;
        const nextRole: Role = data?.role === "admin" ? "admin" : "guest";

        setRole(nextRole);
        setHostelSlug(nextRole === "admin" ? (data?.hostelSlug ?? null) : null);

        setLoading(false);
      },
      (err) => {
        console.error("AuthProvider user doc error:", err);
        setRole("guest");
        setHostelSlug(null);
        setLoading(false);
      }
    );
  });

  return () => {
    if (unsubscribeUserDoc) unsubscribeUserDoc();
    unsubscribeAuth();
  };
}, []);
  return (
    <AuthContext.Provider value={{ user, hostelSlug, role, loading }}>
    {children}
  </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);