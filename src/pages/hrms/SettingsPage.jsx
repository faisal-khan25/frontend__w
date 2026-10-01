import { useSearchParams } from "react-router-dom";
import { UserCircle, KeyRound } from "lucide-react";
import HrmsPage from "../../components/hrms/layout/HrmsPage";
import AccountInformation from "../../components/hrms/settings/AccountInformation";
import ChangePasswordForm from "../../components/hrms/settings/ChangePasswordForm";

const SECTIONS = [
  { id: "account", label: "Account Information", icon: UserCircle },
  { id: "password", label: "Change Password", icon: KeyRound },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const active = SECTIONS.some((s) => s.id === requested) ? requested : "account";

  return (
    <HrmsPage title="Settings" subtitle="Manage your account details and security.">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <nav
          aria-label="Settings sections"
          className="card w-full md:w-60 shrink-0 p-2 flex md:flex-col gap-1 overflow-x-auto"
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setParams({ section: id }, { replace: true })}
              aria-current={active === id ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                active === id
                  ? "bg-primary-50 text-primary-700"
                  : "text-ink hover:bg-primary-50 hover:text-primary-700"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 w-full">
          {active === "account" ? <AccountInformation /> : <ChangePasswordForm />}
        </div>
      </div>
    </HrmsPage>
  );
}