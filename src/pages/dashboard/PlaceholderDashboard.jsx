import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { logout as logoutAction } from "../../redux/authSlice";

export default function PlaceholderDashboard({ label }) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="max-w-md w-full card card-pad p-8 text-center">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
          <span className="text-white font-bold text-sm">U</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-1">{label}</h1>
        <p className="text-muted mb-6">
          Signed in as {user?.name} ({user?.role})
        </p>
        <p className="text-sm text-faint mb-6">
          This module isn't built yet — it's a placeholder so the authentication flow (login,
          protected routes, role redirect) can be verified end to end.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate("/calendar")} className="btn-outline">
            Open Calendar
          </button>
          <button
            onClick={() => {
              dispatch(logoutAction());
              navigate("/login", { replace: true });
            }}
            className="btn-primary"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}