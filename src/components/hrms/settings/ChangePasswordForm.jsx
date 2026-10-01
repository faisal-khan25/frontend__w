import { useState } from "react";
import { KeyRound, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { changePassword } from "../../../services/authService";

// Same rules the backend enforces (auth.validators PASSWORD_REGEX) and the
// reset-password page displays.
const RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
  { key: "special", label: "One special character", test: (v) => /[@$!%*?&#^()_\-+=]/.test(v) },
];

const inputCls =
  "w-full rounded-xl border border-line bg-canvas px-3 py-2 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordField({ id, label, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-faint uppercase tracking-wide">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-coral mt-1">{error}</p>}
    </div>
  );
}

export default function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
    setSuccess(null);
  };

  function validate() {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required";
    if (!form.newPassword) e.newPassword = "New password is required";
    else if (!RULES.every((r) => r.test(form.newPassword)))
      e.newPassword = "Password doesn't meet the requirements below";
    else if (form.newPassword === form.currentPassword)
      e.newPassword = "New password must be different from the current password";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your new password";
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setFormError(null);
    setSuccess(null);

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await changePassword(form);
      const msg = res?.message || "Password changed successfully";
      setSuccess(msg);
      toast.success(msg);
      setForm(EMPTY);
    } catch (err) {
      const fields = err.response?.data?.fields;
      setFormError(
        err.friendlyMessage ||
          err.response?.data?.error ||
          (fields ? "Please check the highlighted fields." : "Unable to change password. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card card-pad max-w-xl space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <KeyRound size={18} className="text-primary" /> Change Password
        </h2>
        <p className="text-sm text-muted mt-1">
          Enter your current password, then choose a new one.
        </p>
      </div>

      {success && <div className="state-success" role="status">{success}</div>}
      {formError && <div className="state-error" role="alert">{formError}</div>}

      <PasswordField
        id="currentPassword"
        label="Current Password"
        value={form.currentPassword}
        onChange={set("currentPassword")}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <PasswordField
        id="newPassword"
        label="New Password"
        value={form.newPassword}
        onChange={set("newPassword")}
        error={errors.newPassword}
        autoComplete="new-password"
      />

      <ul className="grid sm:grid-cols-2 gap-1 text-xs">
        {RULES.map((r) => {
          const ok = r.test(form.newPassword);
          return (
            <li key={r.key} className={`flex items-center gap-1.5 ${ok ? "text-primary-700" : "text-faint"}`}>
              {ok ? <Check size={12} /> : <X size={12} />} {r.label}
            </li>
          );
        })}
      </ul>

      <PasswordField
        id="confirmPassword"
        label="Confirm New Password"
        value={form.confirmPassword}
        onChange={set("confirmPassword")}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <button type="submit" disabled={busy} className="btn-primary inline-flex items-center gap-2">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? "Changing…" : "Change Password"}
      </button>
    </form>
  );
}