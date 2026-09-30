import { useState } from "react";
import Modal from "../common/Modal";
import * as taskService from "../../services/taskService";
import { PRIORITIES, PRIORITY_LABEL } from "../../utils/taskConstants";

export default function AddTaskModal({ task, onClose, onSaved }) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { title: title.trim(), description: description.trim(), dueDate: dueDate || null, priority };
      const saved = isEdit
        ? await taskService.updateTask(task.id, payload)
        : await taskService.createTask(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Personal Task" : "New Personal Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="state-error">{error}</div>}

        {!isEdit && (
          <p className="text-xs text-faint -mt-1">
            A personal to-do just for you. It won't be visible to your admin.
          </p>
        )}

        <div>
          <label className="field-label" htmlFor="taskTitle">Title</label>
          <input
            id="taskTitle"
            type="text"
            className="input-field mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Submit expense report"
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <label className="field-label" htmlFor="taskDescription">Description (optional)</label>
          <textarea
            id="taskDescription"
            rows={3}
            className="input-field mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any extra detail"
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="taskDueDate">Due date (optional)</label>
            <input
              id="taskDueDate"
              type="date"
              className="input-field mt-1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="taskPriority">Priority</label>
            <select
              id="taskPriority"
              className="input-field mt-1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
