import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  UserCircle,
  FolderOpen,
  Umbrella,
  Clock,
  CalendarDays,
  CalendarRange,
  ListChecks,
  Bell,
  Wallet,
  Settings,
  X,
} from "lucide-react";

// Every HRMS module has its own route under /hrms.
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/hrms/dashboard" },
  { id: "attendance", label: "Attendance", icon: Clock, path: "/hrms/attendance" },
  { id: "leave", label: "Leave", icon: Umbrella, path: "/hrms/leave", badgeKey: "pendingLeaves" },
  { id: "documents", label: "My Documents", icon: FolderOpen, path: "/hrms/documents" },
  { id: "profile", label: "Profile", icon: UserCircle, path: "/hrms/profile" },
  { id: "holidays", label: "Holiday Calendar", icon: CalendarDays, path: "/hrms/holidays" },
  { id: "calendar", label: "Calendar", icon: CalendarRange, path: "/hrms/calendar" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/hrms/tasks" },
  { id: "payroll", label: "Payroll", icon: Wallet, path: "/hrms/payroll" },
  { id: "notifications", label: "Notifications", icon: Bell, path: "/hrms/notifications", badgeKey: "unreadNotifications" },
  { id: "settings", label: "Settings", icon: Settings, path: "/hrms/settings" },
];

export default function Sidebar({ open, onClose, badges = {} }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-0 h-screen lg:h-[calc(100vh-4rem)]
          w-72 shrink-0 bg-surface border-r border-line overflow-y-auto
          transition-transform duration-200 lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-line lg:hidden">
          <span className="font-display font-bold text-ink">Menu</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary-50" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = item.badgeKey ? badges[item.badgeKey] : undefined;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-ink hover:bg-primary-50 hover:text-primary-700"
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                {typeof count === "number" && count > 0 && (
                  <span className="badge-primary !px-2 !py-0.5 text-[11px]">{count}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}