import HrmsPage from "../../components/hrms/layout/HrmsPage";
import NotificationsWidget from "../../components/dashboard/NotificationsWidget";

export default function HrmsNotificationsPage() {
  return (
    <HrmsPage title="Notifications" subtitle="Updates about your leave, tasks and payroll.">
      <NotificationsWidget />
    </HrmsPage>
  );
}