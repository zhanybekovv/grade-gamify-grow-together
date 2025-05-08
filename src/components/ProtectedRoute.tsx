
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: string[];
}

const ProtectedRoute = ({ children, allowedUserTypes }: ProtectedRouteProps) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && currentUser && !allowedUserTypes.includes(currentUser.type)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
