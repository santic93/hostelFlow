import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import HotelLoading from "../../components/HotelLoading";
export default function AdminRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();

  // loading cubre el periodo en que leemos auth + user doc
  if (loading) return <HotelLoading text="Cargando panel..." />;

  if (!user) return <Navigate to="/login" replace />;

  // si hay user pero no es admin o no tiene hostelSlug => no lo tires afuera sin mensaje
  if (role !== "admin" || !hostelSlug) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${hostelSlug}/admin`} replace />;
}