import { Navigate, useParams } from "react-router-dom";
import HotelLoading from "../components/HotelLoading";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, role, hostelSlug: adminHostelSlug, loading } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();

  if (loading) return <HotelLoading text="Verificando acceso..." />;

  if (!user) return <Navigate to="/login" replace />;

  if (role !== "admin" || !adminHostelSlug) {
    // no admin => vuelve al sitio público
    return <Navigate to="/" replace />;
  }

  // ✅ evita que un admin entre al panel de otro hostel escribiendo la URL
  if (slugFromUrl && slugFromUrl !== adminHostelSlug) {
    return <Navigate to={`/${adminHostelSlug}/admin`} replace />;
  }

  return children;
}