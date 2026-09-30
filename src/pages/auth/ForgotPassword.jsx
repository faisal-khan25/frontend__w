import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import { forgotPassword } from "../../services/authService";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const data = await forgotPassword(email);
      toast.success(data.message);
      setSent(true);
    } catch (err) {
      const message = err.friendlyMessage || err.response?.data?.error || "Something went wrong. Please try again";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We've sent a password reset link to ${email}`}>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
            <MailCheck size={22} className="text-primary-600" />
          </div>
          <p className="text-sm text-muted">
            Click the link in that email to choose a new password. If it doesn't arrive within a few
            minutes, check your spam folder or try again.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-sm text-primary-600 font-semibold hover:underline"
          >
            Use a different email
          </button>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-faint hover:text-ink transition"
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your work email and we'll send you a password reset link"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          error={error}
        />

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-faint hover:text-ink transition"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}
