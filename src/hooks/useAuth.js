import { useSelector } from "react-redux";

const ROLE_DASHBOARD_PATHS = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/hrms/dashboard",
};

export function useAuth() {
  const { user, token, role, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const dashboardPath = ROLE_DASHBOARD_PATHS[role] || "/login";

  return { user, token, role, isAuthenticated, loading, error, dashboardPath };
}

export default useAuth;