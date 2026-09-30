import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Menu, Bell, ChevronDown, LogOut, LayoutGrid, UserCircle } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { logout as logoutAction } from "../redux/authSlice";
import { workspaceNotificationApi } from "../lib/index";
import GlobalSearch from "./GlobalSearch";


function Avatar({ name, src }) {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials || "U"
      )}
    </div>
  );
}


export default function WorkspaceTopbar({ onMenuClick }) {
  const { user, dashboardPath } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    function loadCount() {
      workspaceNotificationApi
        .getMyNotifications({ unreadOnly: true, pageSize: 1 })
        .then((res) => {
          if (!cancelled) setUnreadCount(res.unreadCount || 0);
        })
        .catch(() => {});
    }
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleLogout() {
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-line shadow-soft">
      <div className="flex items-center gap-3 h-16 px-4 lg:px-6">
        <button
          className="p-2 -ml-2 rounded-lg hover:bg-primary-50 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={() => navigate("/workspace")}
          className="flex items-center gap-2 shrink-0 lg:hidden"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">S</span>
          </div>
          <span className="font-display font-bold text-ink hidden sm:inline">Workspace</span>
        </button>

        <GlobalSearch />

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => navigate(dashboardPath)}
            title="Back to HRMS"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:bg-primary-50 hover:text-ink transition-colors"
          >
            <LayoutGrid size={16} /> HRMS
          </button>

          <button
            onClick={() => navigate("/workspace/notifications")}
            aria-label="Notifications"
            className="relative p-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            <Bell size={19} className="text-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-primary-50 transition-colors"
            >
              <Avatar name={user?.name} src={user?.profileImage} size="sm" />
              <ChevronDown size={16} className={`text-muted transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-primary-50 text-left"
                >
                  <UserCircle size={16} /> My HRMS Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-coral hover:bg-coral-bg text-left border-t border-line"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}