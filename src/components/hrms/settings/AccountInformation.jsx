import { useEffect, useState } from "react";
import { UserCircle, RefreshCw } from "lucide-react";
import * as profileService from "../../../services/profileService";

function formatRole(role) {
  return role ? role.charAt(0) + role.slice(1).toLowerCase() : "";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Read-only account details, loaded from the existing GET /profile/me API.
export default function AccountInformation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await profileService.getMyProfile());
    } catch {
      setError("Unable to load your account information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const user = data?.user;
  const profile = data?.profile;

  const fields = [
    { label: "Full Name", value: user?.name },
    { label: "Employee ID", value: profile?.employeeCode },
    { label: "Email", value: user?.email },
    { label: "Phone Number", value: profile?.workPhone || profile?.personalPhone },
    { label: "Department", value: user?.department },
    { label: "Designation", value: profile?.designation },
    { label: "Role", value: formatRole(user?.role) },
    { label: "Date of Joining", value: formatDate(profile?.dateOfJoining) },
    {
      label: "Account Status",
      value: user ? (user.isActive === false ? "Inactive" : "Active") : "",
    },
  ];

  return (
    <div className="card card-pad">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
        <UserCircle size={18} className="text-primary" /> Account Information
      </h2>
      <p className="text-sm text-muted mb-5">
        These details are managed by HR. To update personal details, use the Profile page.
      </p>

      {loading && (
        <div className="grid sm:grid-cols-2 gap-4" aria-busy="true">
          {fields.map((f) => (
            <div key={f.label} className="h-14 rounded-xl bg-canvas animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="state-error flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={load} className="btn-outline btn-sm inline-flex items-center gap-1">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs font-medium text-faint uppercase tracking-wide">{f.label}</dt>
              <dd className="text-sm font-medium text-ink mt-1 break-words">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}