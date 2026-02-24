// AdminRedirect.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function AdminRedirect() {
  const { role, hostelSlug, user } = useAuth();

  // si ni logueado -> login default
  if (!user) return <Navigate to="/selina/login" replace />;

  // si es admin y tiene slug -> a su admin
  if (role === "admin" && hostelSlug) return <Navigate to={`/${hostelSlug}/admin`} replace />;

  // si es guest -> home
  return <Navigate to="/selina" replace />;
}