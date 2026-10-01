import { Users } from "lucide-react";
import HrmsPage from "../../components/hrms/layout/HrmsPage";
import LeaveWidget from "../../components/dashboard/LeaveWidget";
import ComingSoonCard from "../../components/dashboard/employee/ComingSoonCard";

export default function LeavePage() {
  return (
    <HrmsPage title="Leave" subtitle="Apply for leave and track your requests.">
      <div className="grid lg:grid-cols-2 gap-6">
        <LeaveWidget />
        <ComingSoonCard
          id="team-leave"
          icon={Users}
          title="Team Members On Leave"
          description="Requires a team/manager relationship and an org-wide leave feed - not yet exposed to the employee API."
        />
      </div>
    </HrmsPage>
  );
}