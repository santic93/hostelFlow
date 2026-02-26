import { Navigate } from "react-router-dom";
import HotelLoading from "../../components/HotelLoading";
import { useAuth } from "../../context/AuthContext";
import { t } from "i18next";


export default function AdminRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();

if (loading) return <HotelLoading text={t("admin.loadingPanel")} subtitle={t("admin.loadingPanelSub")} />;

  if (!user) return <Navigate to="/login" replace />;

  // ✅ logueado pero NO admin / perfil incompleto
  if (role !== "admin" || !hostelSlug) {
    return <Navigate to="/login?forbidden=1" replace />;
  }

  return <Navigate to={`/${hostelSlug}/admin`} replace />;
}