import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import { login as loginRequest, loginWithGoogle as loginWithGoogleRequest } from "../../services/authService";
import { authRequestStart, authRequestFailure, loginSuccess } from "../../redux/authSlice";

const ROLE_DASHBOARD_PATHS = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/employee/dashboard",
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.email) errors.email = "Email is required";
    else if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    dispatch(authRequestStart());

    try {
      const data = await loginRequest({ email: form.email, password: form.password });
      dispatch(loginSuccess(data));
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);

      const redirectTo = location.state?.from?.pathname
        || ROLE_DASHBOARD_PATHS[data.user.role]
        || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.friendlyMessage || err.response?.data?.error || "Invalid email or password";
      dispatch(authRequestFailure(message));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    if (googleSubmitting || submitting) return;

    setGoogleSubmitting(true);
    dispatch(authRequestStart());

    try {
      const data = await loginWithGoogleRequest();
      dispatch(loginSuccess(data));
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);

      const redirectTo = location.state?.from?.pathname
        || ROLE_DASHBOARD_PATHS[data.user.role]
        || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.cancelled) {
        dispatch(authRequestFailure(null));
        return;
      }
      const message = err.friendlyMessage || err.response?.data?.error || "Google sign-in failed. Please try again";
      dispatch(authRequestFailure(message));
      toast.error(message);
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Shnoor workspace"
      promoTitle={"Work smarter.\nWork together."}
      promoDescription="Manage your workspace and your people in one place — mail, chat, drive, meetings, attendance, leave and payroll."
      footer={
        <p className="w-full text-center text-muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary-700 font-semibold hover:text-primary-600 transition-colors">
            Create account
          </Link>
        </p>
      }
    >
      <form id="login-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <FormField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-faint hover:text-ink transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-sm -mt-1">
          <label className="flex items-center gap-2 text-muted text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-line text-primary-700 focus:ring-primary-200"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary-700 font-medium hover:text-primary-600 transition-colors">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={submitting || googleSubmitting} className="btn-primary w-full">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-line" />
          <span className="mx-3 text-xs uppercase tracking-wide text-faint">or</span>
          <div className="flex-grow border-t border-line" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting || googleSubmitting}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white text-ink text-sm font-medium hover:bg-canvas transition-colors disabled:opacity-50"
        >
          {googleSubmitting ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          {googleSubmitting ? "Connecting..." : "Continue with Google"}
        </button>
      </form>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.581-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
