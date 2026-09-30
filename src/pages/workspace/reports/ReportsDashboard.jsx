import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Users, UserCheck, CalendarCheck, CalendarX, Umbrella,
  ListTodo, CheckSquare, FileStack,
} from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonCard } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import { formatDateOnly } from "../../../utils/date";
import ReportPageHeader from "./components/ReportPageHeader";
import StatCardsGrid from "./components/StatCardsGrid";

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the reports dashboard."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const cardsData = data?.cards;

  const statCards = cardsData
    ? [
        { key: "totalEmployees", icon: Users, label: "Total Employees", value: cardsData.totalEmployees, tone: "primary" },
        { key: "activeEmployees", icon: UserCheck, label: "Active Employees", value: cardsData.activeEmployees, tone: "sky" },
        { key: "presentToday", icon: CalendarCheck, label: "Present Today", value: cardsData.presentToday, tone: "mint" },
        { key: "absentToday", icon: CalendarX, label: "Absent Today", value: cardsData.absentToday, tone: "coral" },
        { key: "onLeaveToday", icon: Umbrella, label: "On Leave Today", value: cardsData.onLeaveToday, tone: "amber" },
        { key: "totalTasks", icon: BarChart3, label: "Total Tasks", value: cardsData.pendingTasks + cardsData.completedTasks, tone: "violet" },
        { key: "pendingTasks", icon: ListTodo, label: "Pending Tasks", value: cardsData.pendingTasks, tone: "amber" },
        { key: "completedTasks", icon: CheckSquare, label: "Completed Tasks", value: cardsData.completedTasks, tone: "mint" },
        { key: "documentsUploaded", icon: FileStack, label: "Documents Uploaded", value: cardsData.documentsUploaded, tone: "sky" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      <ReportPageHeader
        icon={BarChart3}
        title="Reports"
        description={data ? `Snapshot as of ${formatDateOnly(data.date)}` : "Organization-wide HR and workspace reporting"}
      />

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card"><SkeletonCard /></div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          <StatCardsGrid cards={statCards} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportLinkCard
              icon={Users}
              title="Employee Report"
              description="Directory, roles, departments, and status."
              onClick={() => navigate("/workspace/reports/employees")}
            />
            <ReportLinkCard
              icon={CalendarCheck}
              title="Attendance Report"
              description="Punch-in/out, status, and working hours."
              onClick={() => navigate("/workspace/reports/attendance")}
            />
            <ReportLinkCard
              icon={Umbrella}
              title="Leave Report"
              description="Leave requests by type, status, and range."
              onClick={() => navigate("/workspace/reports/leave")}
            />
            <ReportLinkCard
              icon={ListTodo}
              title="Task Report"
              description="Task status, priority, and workload by employee."
              onClick={() => navigate("/workspace/reports/tasks")}
            />
            <ReportLinkCard
              icon={FileStack}
              title="Document Report"
              description="Uploaded documents by category and status."
              onClick={() => navigate("/workspace/reports/documents")}
            />
            <ReportLinkCard
              icon={BarChart3}
              title="Department Report"
              description="Headcount, attendance, and tasks by department."
              onClick={() => navigate("/workspace/reports/departments")}
            />
            <ReportLinkCard
              icon={BarChart3}
              title="Custom Report"
              description="Build your own report from any category."
              onClick={() => navigate("/workspace/reports/custom")}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ReportLinkCard({ icon: Icon, title, description, onClick }) {
  return (
    <button onClick={onClick} className="card card-hover card-pad text-left flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
        <Icon size={17} className="text-primary-600" />
      </div>
      <p className="font-display font-bold text-ink text-sm">{title}</p>
      <p className="text-xs text-muted">{description}</p>
    </button>
  );
}
