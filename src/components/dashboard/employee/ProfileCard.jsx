import { IdCard, Mail, Building2, BadgeCheck, Info } from "lucide-react";

export default function ProfileCard({ user }) {
  const initials = (user?.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div id="profile" className="card card-pad scroll-mt-20">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-4">
        <IdCard size={18} className="text-primary" /> Employee Profile
      </h2>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            initials || "U"
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink truncate">{user?.name || "—"}</p>
          <p className="text-sm text-muted truncate">{user?.role ? formatRole(user.role) : "—"}</p>
          {user?.isActive === false && <span className="badge-coral mt-1">Inactive</span>}
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <Row icon={Building2} label="Department" value={user?.department || "Not assigned"} />
        <Row icon={Mail} label="Official Email" value={user?.email} />
        <Row icon={BadgeCheck} label="Role" value={user?.role ? formatRole(user.role) : "—"} />
      </dl>

      <div className="mt-5 pt-4 border-t border-line flex items-start gap-2 text-xs text-faint">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          Employee ID, designation, work type, contracted hours, phone numbers, emergency contact and
          reporting manager will appear here once those fields are added to the employee profile in
          the HRMS backend.
        </span>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-faint shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-faint uppercase tracking-wide">{label}</p>
        <p className="text-ink font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function formatRole(role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
