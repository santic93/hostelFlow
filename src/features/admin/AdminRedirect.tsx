import { Navigate } from "react-router-dom";
import { t } from "i18next";
import HotelLoading from "../../components/HotelLoading";
import { useAuth } from "../../app/providers/AuthContext";

export default function AdminRedirect() {
  const { user, hostelSlug, loading, canAccessAdmin } = useAuth();

  if (loading) {
    return <HotelLoading text={t("admin.loadingPanel")} subtitle={t("admin.loadingPanelSub")} />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccessAdmin || !hostelSlug) {
    return <Navigate to="/login?forbidden=1" replace />;
  }

  return <Navigate to={`/${hostelSlug}/admin`} replace />;
}