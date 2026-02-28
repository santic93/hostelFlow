import type { JSX } from "react";
import { Navigate, useParams } from "react-router-dom";
import HotelLoading from "./HotelLoading";
import { useAuth } from "../app/providers/AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, hostelSlug: adminHostelSlug, loading, canAccessAdmin } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();

  if (loading) return <HotelLoading />;
  if (!user) return <Navigate to="/login" replace />;

  // ✅ Staff+ del hostel activo
  if (!canAccessAdmin || !adminHostelSlug) return <Navigate to={`/${slugFromUrl ?? ""}`} replace />;

  // ✅ Evita entrar al panel de otro hostel tipeando URL
  if (slugFromUrl && slugFromUrl !== adminHostelSlug) {
    return <Navigate to={`/${adminHostelSlug}/admin`} replace />;
  }

  return children;
}