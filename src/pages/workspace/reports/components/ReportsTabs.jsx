import { NavLink } from "react-router-dom";
import {
  LayoutGrid, Users, Clock, Umbrella, CheckSquare, Wallet, Building2, FileText, SlidersHorizontal,
} from "lucide-react";

export default function ReportsTabs({ role }) {
  const items = [
    { to: "/workspace/reports", end: true, icon: LayoutGrid, label: "Dashboard" },
    { to: "/workspace/reports/employees", icon: Users, label: "Employees" },
    { to: "/workspace/reports/attendance", icon: Clock, label: "Attendance" },
    { to: "/workspace/reports/leave", icon: Umbrella, label: "Leave" },
    { to: "/workspace/reports/tasks", icon: CheckSquare, label: "Tasks" },
    ...(role === "ADMIN" || role === "HR"
      ? [{ to: "/workspace/reports/payroll", icon: Wallet, label: "Payroll" }]
      : []),
    { to: "/workspace/reports/departments", icon: Building2, label: "Departments" },
    { to: "/workspace/reports/documents", icon: FileText, label: "Documents" },
    { to: "/workspace/reports/custom", icon: SlidersHorizontal, label: "Custom" },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-primary-50 text-primary-700" : "text-muted hover:bg-primary-50 hover:text-ink"
            }`
          }
        >
          <item.icon size={15} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
