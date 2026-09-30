import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { formatDateOnly } from "../../../utils/date";
import ReportPageHeader from "./components/ReportPageHeader";

export default function DepartmentReport() {
  const [departments, setDepartments] = useState([]);
  const [date, setDate] = useState(null);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = { department: department || undefined };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getDepartmentReport(filters)
      .then((res) => {
        setDepartments(res.departments || []);
        setDate(res.date || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the department report."))
      .finally(() => setLoading(false));
  }, [department]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={Building2}
        title="Department Report"
        description={date ? `Headcount, attendance, and tasks as of ${formatDateOnly(date)}.` : "Headcount, attendance, and tasks by department."}
      />

      <div className="card card-pad space-y-4">
        <input
          className="input-field w-52"
          placeholder="Filter by department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        {loading && <SkeletonList rows={6} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && departments.length === 0 && (
          <EmptyState icon={Building2} title="No department data available" />
        )}

        {!loading && !error && departments.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-faint text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-medium">Department</th>
                  <th className="px-2 py-2 font-medium">Employees</th>
                  <th className="px-2 py-2 font-medium">Present Today</th>
                  <th className="px-2 py-2 font-medium">Absent Today</th>
                  <th className="px-2 py-2 font-medium">On Leave Today</th>
                  <th className="px-2 py-2 font-medium">Tasks</th>
                  <th className="px-2 py-2 font-medium">Completed Tasks</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.department} className="border-t border-line">
                    <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{d.department}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.employees}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.present}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.absent}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.onLeave}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.tasks}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{d.completedTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
