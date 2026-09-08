import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no allowedRoles provided, allow any authenticated user
  if (allowedRoles.length === 0) return children;

  const hasRole = allowedRoles.some(role => {
    // support both boolean flags and string roles
    if (typeof user.role === 'string') return user.role === role;
    if (role === 'mentor' && user.isMentor) return true;
    if (role === 'learner' && user.isLearner) return true;
    return false;
  });

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
