import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import HotelLoading from "../components/HotelLoading";
import { useTranslation } from "react-i18next";

type Role = "admin" | "guest";

type AuthContextType = {
  user: User | null;
  hostelSlug: string | null;
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
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [hostelSlug, setHostelSlug] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

  const MIN_LOADING_MS = 1400;
  const [showLoading, setShowLoading] = useState(true);

  // Loader “mínimo” para que no parpadee
  useEffect(() => {
    let timer: number | undefined;

    if (loading) {
      setShowLoading(true);
    } else {
      timer = window.setTimeout(() => setShowLoading(false), MIN_LOADING_MS);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // limpio sub anterior si existía
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

      unsubscribeUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) {
            setRole("guest");
            setHostelSlug(null);
            setLoading(false);
            return;
          }

          const data = snap.data() as any;
          const nextRole: Role = data?.role === "admin" ? "admin" : "guest";
          const nextSlug = nextRole === "admin" ? (data?.hostelSlug ?? null) : null;

          setRole(nextRole);
          setHostelSlug(nextSlug);
          setLoading(false);
        },
        () => {
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
      {showLoading ? (
        <HotelLoading text={t("auth.entering")} subtitle={t("auth.checkingSession")} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);