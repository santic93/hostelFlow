import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";


export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, role, hostelSlug, loading } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams<{ hostelSlug: string }>();

  if (loading) return null; // o loader

  if (!user) return <Navigate to={`/${slugFromUrl}/login`} replace />;

  if (role !== "admin") return <Navigate to={`/${slugFromUrl}`} replace />;

  // si admin tiene hostelSlug, forzamos el tenant correcto
  if (hostelSlug && slugFromUrl && hostelSlug !== slugFromUrl) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  return children;
}