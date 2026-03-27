import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getHomePathByRole, getRoleName } from "./roleUtils";

function AuthLoadingScreen() {
  return (
    <main className="min-h-screen bg-bg-dark text-[color:var(--text)] flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[color:var(--accent)]" />
        <p className="text-sm text-slate-500">Checking your session...</p>
      </div>
    </main>
  );
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = getRoleName(user?.role);
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to={getHomePathByRole(currentRole)} replace />;
    }
  }

  return children;
}
