import useAuth from "../../../../hooks/useAuth";
import ReportsTabs from "./ReportsTabs";

export default function ReportPageHeader({ icon: Icon, title, description, actions }) {
  const { role } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <Icon size={20} className="text-primary-500" /> {title}
          </h1>
          {description && <p className="text-sm text-muted mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <ReportsTabs role={role} />
    </div>
  );
}
