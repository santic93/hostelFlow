import { Navigate, useParams } from "react-router-dom";
import HotelLoading from "./HotelLoading";
import { useAuth } from "../app/providers/AuthContext";
import type { JSX } from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading, canAccessAdmin, hostelSlug } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();

  if (loading) return <HotelLoading />;

  if (!user) return <Navigate to="/login" replace />;

  // si está logueado pero no staff+ o sin hostel activo
  if (!canAccessAdmin || !hostelSlug) {
    return <Navigate to="/login?forbidden=1" replace />;
  }

  // evita entrar a admin de otro hostel escribiendo url manual
  if (slugFromUrl && slugFromUrl !== hostelSlug) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  return children;
}