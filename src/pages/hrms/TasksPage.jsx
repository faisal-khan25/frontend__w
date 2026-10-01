import HrmsPage from "../../components/hrms/layout/HrmsPage";
import TasksWidget from "../../components/dashboard/TasksWidget";

export default function TasksPage() {
  return (
    <HrmsPage title="Tasks" subtitle="Tasks assigned to you and your own to-dos.">
      <TasksWidget />
    </HrmsPage>
  );
}