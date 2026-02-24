// ProtectedRoute.tsx
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";


export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, role, hostelSlug } = useAuth();
  const { hostelSlug: slugFromUrl } = useParams();

  if (!user) return <Navigate to={`/${slugFromUrl ?? "selina"}/login`} replace />;

  // ✅ solo admin entra
  if (role !== "admin") return <Navigate to={`/${slugFromUrl ?? "selina"}`} replace />;

  // ✅ si el admin tiene hostelSlug asignado, fuerza que coincida con el tenant de la url
  if (hostelSlug && slugFromUrl && hostelSlug !== slugFromUrl) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  return children;
}