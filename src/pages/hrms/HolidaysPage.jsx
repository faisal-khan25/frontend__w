import HrmsPage from "../../components/hrms/layout/HrmsPage";
import HolidaysWidget from "../../components/dashboard/HolidaysWidget";

export default function HolidaysPage() {
  return (
    <HrmsPage title="Holiday Calendar" subtitle="Company holidays for the year.">
      <HolidaysWidget />
    </HrmsPage>
  );
}