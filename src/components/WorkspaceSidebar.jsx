import { NavLink } from "react-router-dom";
import {
  LayoutGrid, Mail, FolderOpen,
  Calendar, MessageSquare, Users, Video, Bell, Star, Trash2, X, ChevronsLeft, ChevronsRight,
  BarChart3,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

const NAV_ITEMS = [
  { to: "/workspace", end: true, icon: LayoutGrid, label: "Home" },
  { to: "/workspace/mail", icon: Mail, label: "Mail" },
  { to: "/workspace/drive", icon: FolderOpen, label: "Drive" },
  { to: "/workspace/calendar", icon: Calendar, label: "Calendar" },
  { to: "/workspace/chat", icon: MessageSquare, label: "Chat" },
  { to: "/workspace/groups", icon: Users, label: "Groups" },
  { to: "/workspace/meet", icon: Video, label: "Meet" },
  { to: "/workspace/notifications", icon: Bell, label: "Notifications" },
];

const REPORTS_ROLES = ["ADMIN", "HR", "MANAGER"];
const REPORTS_ITEM = { to: "/workspace/reports", icon: BarChart3, label: "Reports" };

const SECONDARY_ITEMS = [
  { to: "/workspace/drive?starred=true", icon: Star, label: "Starred" },
  { to: "/workspace/drive?trashed=true", icon: Trash2, label: "Trash" },
];

export default function WorkspaceSidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { role } = useAuth();
  const navItems = REPORTS_ROLES.includes(role) ? [...NAV_ITEMS, REPORTS_ITEM] : NAV_ITEMS;

  return (
    <>
      
      {open && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-0 h-screen lg:h-[calc(100vh-4rem)]
          bg-surface border-r border-line flex flex-col shrink-0 transition-all duration-200
          ${collapsed ? "lg:w-[76px]" : "lg:w-64"}
          w-72 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-line lg:hidden">
          <span className="font-display font-bold text-ink">Workspace</span>
          <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-lg hover:bg-primary-50">
            <X size={18} />
          </button>
        </div>

        <div className={`hidden lg:flex items-center gap-2.5 h-16 px-4 border-b border-line shrink-0 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-700 text-white font-display font-bold text-xs shrink-0">
            S
          </span>
          {!collapsed && <span className="font-display font-bold text-ink text-sm">Workspace</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border-l-[3px] ${
                  isActive
                    ? "bg-primary-50 text-primary-700 border-primary-600"
                    : "text-muted border-transparent hover:bg-primary-50 hover:text-ink"
                } ${collapsed ? "lg:justify-center" : ""}`
              }
              title={item.label}
            >
              <item.icon size={19} className="shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-3 mt-3 border-t border-line space-y-0.5">
            {SECONDARY_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-primary-50 hover:text-ink transition-colors"
                title={item.label}
              >
                <item.icon size={19} className="shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center gap-2 m-3 px-3 py-2 rounded-xl text-xs font-medium text-faint hover:bg-primary-50 hover:text-ink transition-colors"
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>
      </aside>
    </>
  );
}