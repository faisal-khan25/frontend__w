import { useState } from "react";
import Modal from "../common/Modal";
import * as leaveService from "../../services/leaveService";

export default function ApplyLeaveModal({ leaveTypes, onClose, onApplied }) {
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!leaveTypeId || !fromDate || !toDate) {
      setError("Please fill in leave type and both dates.");
      return;
    }
    if (toDate < fromDate) {
      setError("The \"To\" date can't be before the \"From\" date.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const request = await leaveService.applyLeave({ leaveTypeId, fromDate, toDate, reason });
      onApplied(request);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Apply for Leave" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="state-error">{error}</div>}

        <div>
          <label className="field-label" htmlFor="leaveType">Leave type</label>
          <select
            id="leaveType"
            className="input-field mt-1"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
          >
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="fromDate">From</label>
            <input
              id="fromDate"
              type="date"
              className="input-field mt-1"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="toDate">To</label>
            <input
              id="toDate"
              type="date"
              className="input-field mt-1"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="reason">Reason (optional)</label>
          <textarea
            id="reason"
            rows={3}
            className="input-field mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let your manager know why you're taking leave"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
