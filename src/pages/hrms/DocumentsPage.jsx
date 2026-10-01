import HrmsPage from "../../components/hrms/layout/HrmsPage";
import DocumentsWidget from "../../components/dashboard/DocumentsWidget";

export default function DocumentsPage() {
  return (
    <HrmsPage title="My Documents" subtitle="Upload and manage your employment documents.">
      <DocumentsWidget />
    </HrmsPage>
  );
}