import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, RefreshCw, Pencil, UserX, UserCheck } from "lucide-react";
import * as employeeService from "../../services/employeeService";
import EmployeeFormModal from "./EmployeeFormModal";

const ROLES = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];

const ROLE_BADGE = {
  ADMIN: "badge-violet",
  HR: "badge-sky",
  MANAGER: "badge-amber",
  EMPLOYEE: "badge-primary",
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTarget, setFormTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await employeeService.listEmployees({
        search: search || undefined,
        role: role || undefined,
        page,
        pageSize: 10,
      });
      setEmployees(result.employees);
      setPagination(result.pagination);
    } catch (err) {
      setError("Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved() {
    setFormTarget(null);
    load();
  }

  async function toggleActive(employee) {
    setBusyId(employee.id);
    setError(null);
    try {
      if (employee.isActive) {
        await employeeService.deactivateEmployee(employee.id);
      } else {
        await employeeService.updateEmployee(employee.id, { isActive: true });
      }
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update this employee.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Users size={18} className="text-primary" /> Employee Management
        </h2>
        <button className="btn-primary btn-sm" onClick={() => setFormTarget({})}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            className="input-field pl-9"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <select
          className="input-field w-40"
          value={role}
          onChange={(e) => { setPage(1); setRole(e.target.value); }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading employees…
        </div>
      ) : employees.length === 0 ? (
        <p className="text-sm text-faint py-6 text-center">No employees match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-faint text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium">Role</th>
                  <th className="px-2 py-2 font-medium">Department</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-line">
                    <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{emp.name}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.email}</td>
                    <td className="px-2 py-3">
                      <span className={ROLE_BADGE[emp.role] || "badge-primary"}>{emp.role}</span>
                    </td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{emp.department || "—"}</td>
                    <td className="px-2 py-3">
                      <span className={emp.isActive ? "badge-mint" : "badge-coral"}>
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className="text-faint hover:text-primary transition-colors"
                          onClick={() => setFormTarget(emp)}
                          aria-label={`Edit ${emp.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="text-faint hover:text-coral transition-colors disabled:opacity-40"
                          disabled={busyId === emp.id}
                          onClick={() => toggleActive(emp)}
                          aria-label={emp.isActive ? `Deactivate ${emp.name}` : `Reactivate ${emp.name}`}
                        >
                          {emp.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-faint">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} employees
              </span>
              <div className="flex gap-2">
                <button
                  className="pill !py-1 !px-3 text-xs disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="pill !py-1 !px-3 text-xs disabled:opacity-40"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {formTarget !== null && (
        <EmployeeFormModal
          employee={Object.keys(formTarget).length ? formTarget : null}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
