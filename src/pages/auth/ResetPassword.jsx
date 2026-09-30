import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import { resetPassword } from "../../services/authService";

const RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[@$!%*?&#^()_\-+=]/.test(v) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [resetToken, navigate]);

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const failedRules = RULES.filter((rule) => !rule.test(form.newPassword));
  const passwordsMatch = form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (failedRules.length > 0) {
      setError("Password doesn't meet the requirements below");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const data = await resetPassword({ resetToken, ...form });
      toast.success(data.message || "Password reset successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err.response?.data?.error || "Couldn't reset password. Please try again";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!resetToken) return null;

  return (
    <AuthLayout title="Set a new password" subtitle={email ? `For ${email}` : undefined}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="newPassword"
          label="New password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.newPassword}
          onChange={handleChange}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-faint hover:text-ink transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <ul className="grid grid-cols-1 gap-1 -mt-2">
          {RULES.map((rule) => {
            const passed = rule.test(form.newPassword);
            return (
              <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${passed ? "text-mint" : "text-faint"}`}>
                {passed ? <Check size={12} /> : <X size={12} />}
                {rule.label}
              </li>
            );
          })}
        </ul>

        <FormField
          id="confirmPassword"
          label="Confirm new password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange}
          error={form.confirmPassword && !passwordsMatch ? "Passwords do not match" : undefined}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="text-faint hover:text-ink transition"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {error && <p className="field-error -mt-2">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
