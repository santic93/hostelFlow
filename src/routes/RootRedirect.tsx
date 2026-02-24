import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function RootRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();

  if (loading) return null;

  // admin → su panel
  if (user && role === "admin" && hostelSlug) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  // guest o no logueado → register
  return <Navigate to="/register" replace />;
}