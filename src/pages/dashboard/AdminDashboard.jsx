import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, CalendarRange } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { logout as logoutAction } from "../../redux/authSlice";
import EmployeeManagement from "../../components/admin/EmployeeManagement";
import LeaveApprovals from "../../components/admin/LeaveApprovals";
import TaskManagement from "../../components/admin/TaskManagement";
import PayrollManagement from "../../components/admin/PayrollManagement";
import GlobalSearch from "../../components/GlobalSearch";

export default function AdminDashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  }

  const initials = (user?.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="container-page flex items-center gap-3 h-16">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">U</span>
            </div>
            <span className="font-display font-bold text-ink hidden sm:inline">Union Workspace · Admin</span>
          </div>

          <GlobalSearch />

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <button
              onClick={() => navigate("/calendar")}
              title="Open Calendar"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:bg-primary-50 hover:text-ink transition-colors"
            >
              <CalendarRange size={16} /> Calendar
            </button>
            <button
              onClick={() => navigate("/workspace")}
              title="Open Workspace"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:bg-primary-50 hover:text-ink transition-colors"
            >
              <LayoutGrid size={16} /> Workspace
            </button>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
              {initials || "A"}
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-sm">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-8 space-y-6">
        <div className="card card-pad">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-muted mt-1">Manage employees, assign tasks, and review leave requests.</p>
        </div>

        <EmployeeManagement />
        <TaskManagement />
        <PayrollManagement />
        <LeaveApprovals />
      </main>
    </div>
  );
}