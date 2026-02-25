import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";
import HotelLoading from "../components/HotelLoading";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, role, loading } = useAuth();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();

  if (loading) return <HotelLoading text="Verificando acceso..." />;

  if (!user) return <Navigate to="/login" replace />;

  if (role !== "admin") {
    return <Navigate to={hostelSlug ? `/${hostelSlug}` : "/"} replace />;
  }

  return children;
}