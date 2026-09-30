import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, dashboardPath } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
