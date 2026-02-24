import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getOrCreateHostel } from "../services/hostelService";

type AuthContextType = {
  user: User | null;
  hostelSlug: string | null;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  hostelSlug: null,
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostelSlug, setHostelSlug] = useState<string | null>(null);
 
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const slug = await getOrCreateHostel(firebaseUser);
      setHostelSlug(slug);
      setUser(firebaseUser);
    } else {
      setUser(null);
      setHostelSlug(null);
    }
    setLoading(false);
  });

  return unsubscribe;
}, []);
  return (
    <AuthContext.Provider value={{ user, hostelSlug }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);