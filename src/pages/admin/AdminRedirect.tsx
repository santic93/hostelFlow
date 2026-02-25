import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import HotelLoading from "../../components/HotelLoading";

export default function AdminRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();

  if (loading) return <HotelLoading text="Cargando panel..." />;

  if (!user) return <Navigate to="/login" replace />;

  if (role !== "admin" || !hostelSlug) {
    // logueado pero no admin (o perfil incompleto)
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${hostelSlug}/admin`} replace />;
}