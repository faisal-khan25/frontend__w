import HrmsPage from "../../components/hrms/layout/HrmsPage";
import PayrollWidget from "../../components/dashboard/PayrollWidget";

export default function PayrollPage() {
  return (
    <HrmsPage title="Payroll" subtitle="Your salary slips and payment history.">
      <PayrollWidget />
    </HrmsPage>
  );
}