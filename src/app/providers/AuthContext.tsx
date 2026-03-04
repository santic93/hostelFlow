import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged, getIdTokenResult, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import HotelLoading from "../../components/HotelLoading";

export type Role = "owner" | "manager" | "staff" | "guest";
export type ClaimsRole = "superadmin" | "owner" | "manager" | "staff" | "guest" | "";

export type AuthContextType = {
  user: User | null;

  activeHostelSlug: string | null;
  role: Role;

  // ✅ custom claims
  claimsRole: ClaimsRole;
  isSuperAdmin: boolean;

  // compat
  hostelSlug: string | null;

  isOwner: boolean;
  isManager: boolean;
  isStaff: boolean;
  canAccessAdmin: boolean;

  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeHostelSlug: null,
  role: "guest",

  claimsRole: "",
  isSuperAdmin: false,

  hostelSlug: null,

  isOwner: false,
  isManager: false,
  isStaff: false,
  canAccessAdmin: false,

  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeHostelSlug, setActiveHostelSlug] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("guest");

  const [claimsRole, setClaimsRole] = useState<ClaimsRole>("");
  const [loading, setLoading] = useState(true);

  // loader mínimo para evitar parpadeo
  const MIN_LOADING_MS = 700;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    if (loading) setShowLoading(true);
    else timer = window.setTimeout(() => setShowLoading(false), MIN_LOADING_MS);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loading]);

  // ✅ 1) Auth state
  useEffect(() => {
    let unsubUserDoc: null | (() => void) = null;
    let unsubMemberDoc: null | (() => void) = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubMemberDoc) unsubMemberDoc();
      unsubUserDoc = null;
      unsubMemberDoc = null;

      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setActiveHostelSlug(null);
        setRole("guest");
        setClaimsRole("");
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // user doc: activeHostelSlug
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

  // ✅ 2) Claims (SUPERADMIN)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setClaimsRole("");
        return;
      }
      try {
        const token = await getIdTokenResult(u, true);
        const r = String((token.claims as any)?.role || "");
        setClaimsRole(r as ClaimsRole);
      } catch {
        setClaimsRole("");
      }
    });
    return unsub;
  }, []);

  const isSuperAdmin = claimsRole === "superadmin";

  // roles de hostel
  const isOwner = role === "owner";
  const isManager = role === "manager" || role === "owner";
  const isStaff = role === "staff" || role === "manager" || role === "owner";
  const canAccessAdmin = Boolean(user) && Boolean(activeHostelSlug) && isStaff;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      activeHostelSlug,
      role,

      claimsRole,
      isSuperAdmin,

      hostelSlug: activeHostelSlug,

      isOwner,
      isManager,
      isStaff,
      canAccessAdmin,

      loading,
    }),
    [user, activeHostelSlug, role, claimsRole, isSuperAdmin, isOwner, isManager, isStaff, canAccessAdmin, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {showLoading ? <HotelLoading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);