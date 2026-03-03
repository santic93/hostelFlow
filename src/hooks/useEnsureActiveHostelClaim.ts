import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../services/firebase";


export function useEnsureActiveHostelClaim() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!hostelSlug) return;
      if (!auth.currentUser) return;

      // ✅ Trae claims actuales
      const before = await auth.currentUser.getIdTokenResult(true);
      const currentActive = (before.claims as any)?.activeHostelSlug;

      // Si ya está alineado, no hacemos nada
      if (currentActive === hostelSlug) return;

      // ✅ Llamamos a function para setear activeHostelSlug (solo si sos member)
      const fn = httpsCallable(functions, "setActiveHostel");
      await fn({ slug: hostelSlug });

      if (cancelled) return;

      // ✅ Importantísimo: refrescar token para que Storage use los claims nuevos
      await auth.currentUser.getIdToken(true);
    };

    run().catch((e) => {
      console.error("[useEnsureActiveHostelClaim] error:", e);
    });

    return () => {
      cancelled = true;
    };
  }, [hostelSlug]);
}