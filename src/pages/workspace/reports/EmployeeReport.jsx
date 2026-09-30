import { useCallback, useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { formatDateOnly } from "../../../utils/date";
import { EMPLOYEE_STATUS_BADGE, ROLE_BADGE } from "../../../utils/reportsConstants";
import ReportPageHeader from "./components/ReportPageHeader";
import ReportPagination from "./components/ReportPagination";
import ExportButton from "./components/ExportButton";

const ROLES = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];

export default function EmployeeReport() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    search: debouncedSearch || undefined,
    department: department || undefined,
    role: role || undefined,
    status: status || undefined,
    page,
    pageSize: 15,
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getEmployeeReport(filters)
      .then((res) => {
        setEmployees(res.employees || []);
        setPagination(res.pagination || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the employee report."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, department, role, status, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={Users}
        title="Employee Report"
        description="Directory of employees with role, department, and status."
        actions={<ExportButton type="employees" filters={filters} />}
      />

      <div className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              className="input-field pl-9"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
          <input
            className="input-field w-40"
            placeholder="Department"
            value={department}
            onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
          />
          <select className="input-field w-36" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="input-field w-36" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading && <SkeletonList rows={8} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && employees.length === 0 && (
          <EmptyState icon={Users} title="No employees match these filters" />
        )}

        {!loading && !error && employees.length > 0 && (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Email</th>
                    <th className="px-2 py-2 font-medium">Department</th>
                    <th className="px-2 py-2 font-medium">Designation</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">Manager</th>
                    <th className="px-2 py-2 font-medium">Joined</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{emp.name}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.email}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.department || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.designation || "—"}</td>
                      <td className="px-2 py-3"><span className={ROLE_BADGE[emp.role] || "badge-primary"}>{emp.role}</span></td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.manager?.name || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.joiningDate ? formatDateOnly(emp.joiningDate) : "—"}</td>
                      <td className="px-2 py-3">
                        <span className={EMPLOYEE_STATUS_BADGE[emp.status] || "badge-primary"}>
                          {emp.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportPagination pagination={pagination} page={page} onPageChange={setPage} itemLabel="employees" />
          </>
        )}
      </div>
    </div>
  );
}
