import { Navigate } from "react-router-dom";
import HotelLoading from "../../components/HotelLoading";
import { t } from "i18next";
import { useAuth } from "../../app/providers/AuthContext";

export default function AdminRedirect() {
  const { user, hostelSlug, loading, canAccessAdmin } = useAuth();

  if (loading) {
    return <HotelLoading text={t("admin.loadingPanel")} subtitle={t("admin.loadingPanelSub")} />;
  }

  if (!user) return <Navigate to="/login" replace />;

  // ✅ logueado pero NO staff+ o perfil incompleto
  if (!canAccessAdmin || !hostelSlug) {
    return <Navigate to="/login?forbidden=1" replace />;
  }

  return <Navigate to={`/${hostelSlug}/admin`} replace />;
}