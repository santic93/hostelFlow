import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import HotelLoading from "../../components/HotelLoading";

export type Role = "superadmin" | "owner" | "manager" | "staff" | "guest";

export type AuthContextType = {
  user: User | null;

  activeHostelSlug: string | null;
  role: Role;

  hostelSlug: string | null;

  isSuperAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
  canAccessAdmin: boolean;

  loading: boolean;

  // útil cuando setCustomUserClaims cambian
  refreshTokenClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeHostelSlug: null,
  role: "guest",

  hostelSlug: null,

  isSuperAdmin: false,
  isOwner: false,
  isManager: false,
  isStaff: false,
  canAccessAdmin: false,

  loading: true,
  refreshTokenClaims: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeHostelSlug, setActiveHostelSlug] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

  const MIN_LOADING_MS = 900;
  const [showLoading, setShowLoading] = useState(true);

  const readClaimsRole = async (u: User): Promise<Role | null> => {
    try {
      const tok = await getIdTokenResult(u, true);
      const r = String((tok.claims as any)?.role || "");
      if (r === "superadmin") return "superadmin";
      return null;
    } catch {
      return null;
    }
  };

  const refreshTokenClaims = async () => {
    if (!auth.currentUser) return;
    // fuerza refresh del token y vuelve a disparar lectura del claim
    await getIdTokenResult(auth.currentUser, true);
    // no hacemos set directo acá porque el flujo principal lo recalcula
  };

  useEffect(() => {
    let timer: number | undefined;
    if (loading) setShowLoading(true);
    else timer = window.setTimeout(() => setShowLoading(false), MIN_LOADING_MS);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loading]);

  useEffect(() => {
    let unsubUserDoc: null | (() => void) = null;
    let unsubMemberDoc: null | (() => void) = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubMemberDoc) unsubMemberDoc();
      unsubUserDoc = null;
      unsubMemberDoc = null;

      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setActiveHostelSlug(null);
        setRole("guest");
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // 0) si es superadmin por claim -> no dependemos de membresías
      const claimRole = await readClaimsRole(firebaseUser);
      if (claimRole === "superadmin") {
        setActiveHostelSlug(null);
        setRole("superadmin");
        setLoading(false);
        return;
      }

      // 1) user doc: activeHostelSlug
      const userRef = doc(db, "users", firebaseUser.uid);
      unsubUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) {
            setActiveHostelSlug(null);
            setRole("guest");
            setLoading(false);
            return;
          }

          const data = snap.data() as any;
          const slug = (data?.activeHostelSlug ?? data?.hostelSlug ?? null) as string | null;

          setActiveHostelSlug(slug);

          // 2) member doc del hostel activo
          if (unsubMemberDoc) unsubMemberDoc();
          unsubMemberDoc = null;

          if (!slug) {
            setRole("guest");
            setLoading(false);
            return;
          }

          const memberRef = doc(db, "hostels", slug, "members", firebaseUser.uid);
          unsubMemberDoc = onSnapshot(
            memberRef,
            (m) => {
              if (!m.exists()) {
                setRole("guest");
                setLoading(false);
                return;
              }
              const r = String((m.data() as any)?.role || "guest") as Role;
              setRole(r === "owner" || r === "manager" || r === "staff" ? r : "guest");
              setLoading(false);
            },
            () => {
              setRole("guest");
              setLoading(false);
            }
          );
        },
        () => {
          setActiveHostelSlug(null);
          setRole("guest");
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubMemberDoc) unsubMemberDoc();
      unsubAuth();
    };
  }, []);

  const isSuperAdmin = role === "superadmin";
  const isOwner = role === "owner";
  const isManager = role === "manager" || role === "owner";
  const isStaff = role === "staff" || role === "manager" || role === "owner";
  const canAccessAdmin = isSuperAdmin || (Boolean(user) && Boolean(activeHostelSlug) && isStaff);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      activeHostelSlug,
      role,

      hostelSlug: activeHostelSlug,

      isSuperAdmin,
      isOwner,
      isManager,
      isStaff,
      canAccessAdmin,

      loading,
      refreshTokenClaims,
    }),
    [user, activeHostelSlug, role, isSuperAdmin, isOwner, isManager, isStaff, canAccessAdmin, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {showLoading ? <HotelLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);