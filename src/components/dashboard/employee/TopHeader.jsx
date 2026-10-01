import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ChevronDown, Menu, KeyRound, UserCircle, LogOut, LayoutGrid,
  Mail, FolderOpen, MessageSquare, Calendar, FileText, Table, Presentation, Star,
} from "lucide-react";
import { logout as logoutAction } from "../../../redux/authSlice";
import GlobalSearch from "../../GlobalSearch";

const LAUNCHER_APPS = [
  { to: "/workspace/mail", icon: Mail, label: "Mail" },
  { to: "/workspace/drive", icon: FolderOpen, label: "Drive" },
  { to: "/workspace/chat", icon: MessageSquare, label: "Chat" },
  { to: "/workspace/calendar", icon: Calendar, label: "Calendar" },
  { to: "/workspace/docs", icon: FileText, label: "Docs" },
  { to: "/workspace/sheets", icon: Table, label: "Sheets" },
  { to: "/workspace/slides", icon: Presentation, label: "Slides" },
  { to: "/workspace/drive?starred=true", icon: Star, label: "Starred" },
];

function AppLauncher() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open Workspace app launcher"
        className="p-2 rounded-lg text-muted hover:bg-primary-50 hover:text-ink transition-colors"
        title="Workspace apps"
      >
        <LayoutGrid size={20} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-surface border border-line rounded-2xl shadow-card p-4 z-50"
        >
          <p className="text-sm font-semibold text-ink mb-3">My Workspace</p>
          <div className="grid grid-cols-4 gap-2">
            {LAUNCHER_APPS.map((app) => (
              <button
                key={app.label}
                role="menuitem"
                onClick={() => { setOpen(false); navigate(app.to); }}
                className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-muted hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <app.icon size={20} />
                {app.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setOpen(false); navigate("/workspace"); }}
            className="w-full mt-3 pt-3 border-t border-line text-sm font-medium text-primary-600 hover:text-primary-700 text-center"
          >
            Open Workspace →
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopHeader({ user, onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  }

  function goToProfile() {
    setDropdownOpen(false);
    navigate("/hrms/profile");
  }

  const displayName = user?.name || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-line">
      <div className="flex items-center gap-3 h-16 px-4 lg:px-6">
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="p-2 -ml-2 rounded-lg hover:bg-primary-50 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">U</span>
          </div>
          <span className="font-display font-bold text-ink hidden sm:inline">Union Workspace HRMS</span>
        </div>

        <GlobalSearch />

        <div className="flex items-center gap-1 ml-auto">
        <AppLauncher />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-primary-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                initials || "U"
              )}
            </div>
            <span className="text-sm font-medium text-ink hidden sm:inline max-w-[10rem] truncate">
              {displayName || "Employee"}
            </span>
            <ChevronDown size={16} className={`text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-semibold text-ink truncate">{displayName || "Employee"}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={goToProfile}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-primary-50 text-left"
              >
                <UserCircle size={16} /> My Profile
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/hrms/settings?section=password");
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-primary-50 text-left"
              >
                <KeyRound size={16} /> Change Password
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