import useAuth from "../../hooks/useAuth";
import ProfileCard from "../../components/dashboard/employee/ProfileCard";
import PerformanceCards from "../../components/dashboard/employee/PerformanceCards";
import AttendanceWidget from "../../components/dashboard/AttendanceWidget";

// HRMS dashboard overview. Rendered inside HrmsLayout at /hrms/dashboard.
// Each full module (leave, tasks, payroll, ...) lives on its own /hrms/* page.
export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted mt-1">Here's what's happening with your workspace today.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ProfileCard user={user} />
        <AttendanceWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <PerformanceCards user={user} />
      </div>
    </div>
  );
}