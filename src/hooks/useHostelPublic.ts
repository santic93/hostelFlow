import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { setTenantLanguage } from "../app/providers/i18n";

type HostelPublic = {
  name: string;
  slug: string;
};
export function useHostelPublic(hostelSlug?: string) {
  const [hostel, setHostel] = useState<HostelPublic | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!hostelSlug) {
        setHostel(null);
        return;
      }
      setLoading(true);

      try {
        const snap = await getDoc(doc(db, "hostels", hostelSlug));
        if (!alive) return;

        if (snap.exists()) {
          const data = snap.data() as HostelPublic;

          setHostel(data);

          // ✅ SaaS: idioma por hostel (sin pisar elección del usuario)
          // Campo esperado: defaultLanguage: "es" | "en" | "pt"
          setTenantLanguage((data as any)?.defaultLanguage ?? "es");
        } else {
          setHostel(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [hostelSlug]);

  return { hostel, loading };
}