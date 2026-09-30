import { useState } from "react";
import Modal from "../common/Modal";
import * as employeeService from "../../services/employeeService";

const ROLES = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];

export default function EmployeeFormModal({ employee, onClose, onSaved }) {
  const isEdit = Boolean(employee);
  const [firstName, setFirstName] = useState(employee?.firstName || "");
  const [lastName, setLastName] = useState(employee?.lastName || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [role, setRole] = useState(employee?.role || "EMPLOYEE");
  const [department, setDepartment] = useState(employee?.department || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdInfo, setCreatedInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName || (!isEdit && !email) || !role) {
      setError("Please fill in the required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await employeeService.updateEmployee(employee.id, { firstName, lastName, role, department });
        onSaved();
      } else {
        const result = await employeeService.createEmployee({ firstName, lastName, email, role, department });
        if (result.temporaryPassword) {
          setCreatedInfo(result);
        } else {
          onSaved();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save this employee.");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdInfo) {
    return (
      <Modal title="Employee created" onClose={onSaved}>
        <div className="state-success mb-4">
          {firstName}'s account was created and a welcome email was sent to {email}.
        </div>
        <p className="text-sm text-muted mb-1">Temporary password (shown once, in case the email doesn't land):</p>
        <p className="input-field font-mono text-sm select-all">{createdInfo.temporaryPassword}</p>
        <button className="btn-primary w-full mt-5" onClick={onSaved}>Done</button>
      </Modal>
    );
  }

  return (
    <Modal title={isEdit ? "Edit Employee" : "Add Employee"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="state-error">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="firstName">First name</label>
            <input id="firstName" className="input-field mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input id="lastName" className="input-field mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field mt-1 disabled:opacity-60"
            value={email}
            disabled={isEdit}
            onChange={(e) => setEmail(e.target.value)}
          />
          {isEdit && <p className="text-xs text-faint mt-1">Email can't be changed once an account exists.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="role">Role</label>
            <select id="role" className="input-field mt-1" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="department">Department</label>
            <input id="department" className="input-field mt-1" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
        </div>

        {!isEdit && (
          <p className="text-xs text-faint">
            A temporary password will be generated and emailed to this address.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
