import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function AdminRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();

  if (loading) return null; // o un <Loader />

  if (!user) return <Navigate to="/register" replace />;

  if (role === "admin" && hostelSlug) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  // logueado pero no admin
  return <Navigate to="/" replace />;
}