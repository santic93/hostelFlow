import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/providers/AuthContext";
import HotelLoading from "./HotelLoading";

type Props = React.PropsWithChildren;

export default function SuperAdminRoute({ children }: Props) {
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <HotelLoading />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}