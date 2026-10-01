import HrmsPage from "../../components/hrms/layout/HrmsPage";
import HrmsCalendar from "../dashboard/CalendarPage";

// Reuses the existing HRMS calendar, minus its standalone header.
export default function CalendarPage() {
  return (
    <HrmsPage title="Calendar" subtitle="Events, holidays, leave and birthdays in one view.">
      <HrmsCalendar embedded />
    </HrmsPage>
  );
}