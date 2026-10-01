import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import { signup as signupRequest } from "../../services/authService";
import { authRequestStart, authRequestFailure, loginSuccess } from "../../redux/authSlice";

const ROLE_DASHBOARD_PATHS = {
  ADMIN: "/admin/dashboard",
  HR: "/hr/dashboard",
  MANAGER: "/manager/dashboard",
  EMPLOYEE: "/hrms/dashboard",
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=]).{8,}$/;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.firstName) errors.firstName = "First name is required";
    if (!form.email) errors.email = "Email is required";
    else if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";

    if (!form.password) errors.password = "Password is required";
    else if (!PASSWORD_RULE.test(form.password)) {
      errors.password =
        "At least 8 characters, with uppercase, lowercase, a number, and a special character";
    }

    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (form.password && form.confirmPassword !== form.password) {
      errors.confirmPassword = "Passwords do not match";
    }

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
      const data = await signupRequest(form);
      dispatch(loginSuccess(data));
      toast.success(`Welcome to Union, ${data.user.name.split(" ")[0]}`);

      const redirectTo = ROLE_DASHBOARD_PATHS[data.user.role] || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const backendFieldErrors = err.response?.data?.fields;
      if (backendFieldErrors) {
        setFieldErrors(backendFieldErrors);
      }
      const message = err.friendlyMessage || err.response?.data?.error || "Could not create your account";
      dispatch(authRequestFailure(message));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with your Shnoor workspace"
      promoTitle={"Build a better\nworkplace."}
      promoDescription="Connect your team, manage your people, and get work done from one platform — Workspace and HRMS together."
      footer={
        <p className="w-full text-center text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-600 transition-colors">
            Sign in
          </Link>
        </p>
      }
    >
      <form id="register-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="firstName"
            label="First name"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
          />
          <FormField
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
          />
        </div>

        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <FormField
          id="department"
          label="Department (optional)"
          value={form.department}
          onChange={handleChange}
          error={fieldErrors.department}
        />

        <FormField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
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

        <FormField
          id="confirmPassword"
          label="Confirm password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="text-faint hover:text-ink transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}