import useAuth from "../../hooks/useAuth";
import HrmsPage from "../../components/hrms/layout/HrmsPage";
import AttendanceWidget from "../../components/dashboard/AttendanceWidget";
import PerformanceCards from "../../components/dashboard/employee/PerformanceCards";

export default function AttendancePage() {
  const { user } = useAuth();
  return (
    <HrmsPage title="Attendance" subtitle="Check in, check out and review your working hours.">
      <div className="grid lg:grid-cols-2 gap-6">
        <AttendanceWidget />
        <PerformanceCards user={user} />
      </div>
    </HrmsPage>
  );
}