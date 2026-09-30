import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "top", label: "Dashboard", icon: LayoutGrid, wired: true },
  { id: "profile", label: "My Profile", icon: UserCircle, wired: true },
  { id: "documents", label: "Documents", icon: FolderOpen, wired: true },
  { id: "leave", label: "Leave", icon: Umbrella, wired: true, badgeKey: "pendingLeaves" },
  { id: "attendance", label: "Attendance", icon: Clock, wired: true },
  { id: "holidays", label: "Holiday Calendar", icon: CalendarDays, wired: true },
  { id: "hrms-calendar", label: "Calendar", icon: CalendarRange, wired: true, path: "/calendar" },
  { id: "tasks", label: "Tasks", icon: ListChecks, wired: true },
  { id: "notifications", label: "Notifications", icon: Bell, wired: true, badgeKey: "unreadNotifications" },
];

export default function Sidebar({ open, onClose, badges = {} }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleNavClick(item) {
    if (item.disabled) return;
    if (item.path) {
      navigate(item.path);
      onClose();
      return;
    }
    const el = document.getElementById(item.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    onClose();
  }

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
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                disabled={item.disabled}
                title={item.disabled ? "Not connected to a backend module yet" : undefined}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                  ${
                    item.disabled
                      ? "text-faint cursor-not-allowed"
                      : "text-ink hover:bg-primary-50 hover:text-primary-700"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                {typeof count === "number" && count > 0 && (
                  <span className="badge-primary !px-2 !py-0.5 text-[11px]">{count}</span>
                )}
                {!item.wired && (
                  <span className="text-[10px] uppercase tracking-wide text-faint">Soon</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}