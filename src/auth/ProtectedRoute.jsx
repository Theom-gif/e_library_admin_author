import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getRoleLandingPath } from "./roleRoutes";

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && normalizeRole(user?.role) !== normalizeRole(role)) {
    return <Navigate to={getRoleLandingPath(user?.role)} replace />;
  }

  return children;
}

