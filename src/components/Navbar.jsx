import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LogOut, LayoutDashboard, LayoutGrid, ChevronDown, Menu, X } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { logout as logoutAction } from "../redux/authSlice";

const links = [
  { href: "#workspace", label: "Workspace" },
  { href: "#hrms", label: "HRMS" },
  { href: "#ai", label: "AI" },
  { href: "#security", label: "Security" },
];

function Mark() {
  return (
    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
      <span className="text-white font-bold text-sm">S</span>
    </div>
  );
}

function initials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function ProfileMenu({ user, dashboardPath, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-line hover:border-primary-300 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {initials(user?.name)}
        </span>
        <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
          {user?.name || "Account"}
        </span>
        <ChevronDown size={14} className="text-faint" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-2xl border border-line bg-white shadow-card py-1.5 z-50"
        >
          <div className="px-3.5 py-2 border-b border-line mb-1">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-faint truncate">{user?.email}</p>
          </div>
          <Link
            to={dashboardPath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <LayoutDashboard size={16} />
            HRMS Dashboard
          </Link>
          <Link
            to="/workspace"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <LayoutGrid size={16} />
            Workspace
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-muted hover:text-coral hover:bg-coral-bg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, user, dashboardPath } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  }

  return (
    <header className="w-full border-b border-line bg-white/85 backdrop-blur-md sticky top-0 z-50">
      <div className="container-page h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Mark />
          <span className="text-lg font-extrabold text-ink tracking-tight">Shnoor</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-600 transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {isAuthenticated ? (
            <>
              <Link to="/workspace" className="hidden sm:block">
                <span className="btn-primary btn-sm flex items-center gap-1.5">
                  <LayoutGrid size={14} /> Workspace
                </span>
              </Link>
              <Link to={dashboardPath} className="hidden sm:block">
                <span className="btn-outline btn-sm">HRMS</span>
              </Link>
              <ProfileMenu user={user} dashboardPath={dashboardPath} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block whitespace-nowrap text-sm font-medium text-muted hover:text-ink transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link to="/register" className="hidden sm:block">
                <span className="btn-primary btn-sm">Get started</span>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-ink hover:bg-primary-50 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="h-px bg-line my-2" />
          {isAuthenticated ? (
            <>
              <Link
                to="/workspace"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <LayoutGrid size={16} /> Workspace
              </Link>
              <Link
                to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard size={16} /> HRMS Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="mt-1">
                <span className="btn-primary w-full">Get started</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
