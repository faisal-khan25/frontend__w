import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import * as adminTaskService from "../../services/adminTaskService";
import * as employeeService from "../../services/employeeService";
import { PRIORITIES, PRIORITY_LABEL, SETTABLE_STATUSES, STATUS_LABEL } from "../../utils/taskConstants";

export default function TaskFormModal({ task, onClose, onSaved }) {
  const isEdit = Boolean(task);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?.id || "");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [status, setStatus] = useState(task?.status && SETTABLE_STATUSES.includes(task.status) ? task.status : "PENDING");
  const [startDate, setStartDate] = useState(task?.startDate ? task.startDate.slice(0, 10) : "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    employeeService
      .listEmployees({ pageSize: 100, isActive: true })
      .then((res) => {
        if (!cancelled) setEmployees(res.employees || []);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the employee list.");
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a task description.");
      return;
    }
    if (!assignedTo) {
      setError("Please select an employee to assign this task to.");
      return;
    }
    if (!dueDate) {
      setError("Please set a due date.");
      return;
    }
    if (startDate && dueDate && startDate > dueDate) {
      setError("Due date can't be before the start date.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      priority,
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
    };

    setSubmitting(true);
    setError(null);
    try {
      const saved = isEdit
        ? await adminTaskService.updateTask(task.id, payload)
        : await adminTaskService.createTask(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Task" : "Create Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="state-error">{error}</div>}

        <div>
          <label className="field-label" htmlFor="taskTitle">Title *</label>
          <input
            id="taskTitle"
            type="text"
            className="input-field mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete attendance module"
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <label className="field-label" htmlFor="taskDescription">Description *</label>
          <textarea
            id="taskDescription"
            rows={3}
            className="input-field mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does the employee need to do?"
            maxLength={2000}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="assignedTo">Assign to *</label>
          <select
            id="assignedTo"
            className="input-field mt-1 disabled:opacity-60"
            value={assignedTo}
            disabled={employeesLoading}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">{employeesLoading ? "Loading employees…" : "Select an employee"}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.department ? `· ${emp.department}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="priority">Priority</label>
            <select id="priority" className="input-field mt-1" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="status">Status</label>
            <select id="status" className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
              {SETTABLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              type="date"
              className="input-field mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="dueDate">Due date *</label>
            <input
              id="dueDate"
              type="date"
              className="input-field mt-1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting || employeesLoading} className="btn-primary flex-1">
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create & Assign Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
