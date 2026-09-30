import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import { verifyOTP, forgotPassword } from "../../services/authService";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function handleDigitChange(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    setError("");

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  const handleVerify = useCallback(
    async (e) => {
      e?.preventDefault();
      const otp = digits.join("");
      if (otp.length !== OTP_LENGTH) {
        setError(`Enter all ${OTP_LENGTH} digits`);
        return;
      }

      setVerifying(true);
      try {
        const data = await verifyOTP({ email, otp });
        toast.success("Code verified");
        navigate("/reset-password", { state: { email, resetToken: data.resetToken } });
      } catch (err) {
        const message = err.response?.data?.error || "Invalid or expired code";
        setError(message);
        toast.error(message);
      } finally {
        setVerifying(false);
      }
    },
    [digits, email, navigate]
  );

  async function handleResend() {
    setResending(true);
    try {
      await forgotPassword(email);
      toast.success("A new code has been sent");
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't resend code. Try again shortly");
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

  return (
    <AuthLayout
      title="Enter verification code"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-line
                bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary transition"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {error && <p className="field-error -mt-2">{error}</p>}

        <button type="submit" disabled={verifying} className="btn-primary w-full">
          {verifying && <Loader2 size={16} className="animate-spin" />}
          {verifying ? "Verifying..." : "Verify"}
        </button>

        <div className="text-center text-sm text-muted">
          {secondsLeft > 0 ? (
            <span>Resend code in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 font-semibold hover:underline disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
          )}
        </div>

        <Link to="/login" className="text-center text-sm text-faint hover:text-ink transition">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  );
}
