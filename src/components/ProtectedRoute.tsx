import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }: any) => {
  const { user, hostelSlug } = useAuth();

  if (!user || !hostelSlug) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;