import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function RootRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();
  if (loading) return null;

  if (user && role === "admin" && hostelSlug) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  return <Navigate to="/login" replace />;
}