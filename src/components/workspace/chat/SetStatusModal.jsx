import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import statusApi, { STATUS_TYPES } from "../../../lib/statusApi";

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultWindow() {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: toLocalInput(start), end: toLocalInput(end) };
}

export default function SetStatusModal({ onClose, onSaved }) {
  const [current, setCurrent] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [statusType, setStatusType] = useState("MEETING");
  const [message, setMessage] = useState("");
  const [window, setWindow] = useState(defaultWindow);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    statusApi
      .getMyStatus()
      .then((status) => {
        setCurrent(status);
        if (status) {
          setStatusType(status.statusType);
          setMessage(status.statusType === "CUSTOM" ? status.message || "" : status.message || "");
          setWindow({ start: toLocalInput(new Date(status.startTime)), end: toLocalInput(new Date(status.endTime)) });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCurrent(false));
  }, []);

  async function handleSave() {
    if (statusType === "CUSTOM" && !message.trim()) {
      toast.error("Enter a custom message");
      return;
    }
    if (!window.start || !window.end) {
      toast.error("Start and end time are required");
      return;
    }
    const startTime = new Date(window.start);
    const endTime = new Date(window.end);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      toast.error("Enter a valid start and end time");
      return;
    }
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    if (endTime <= new Date()) {
      toast.error("End time must be in the future");
      return;
    }

    setSaving(true);
    try {
      const saved = await statusApi.setMyStatus({
        statusType,
        message: message.trim() || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      toast.success("Status set");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't set status");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setClearing(true);
    try {
      await statusApi.clearMyStatus();
      toast.success("Status cleared");
      onSaved?.(null);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't clear status");
    } finally {
      setClearing(false);
    }
  }

  return (
    <WorkspaceModal
      title="Set your status"
      onClose={onClose}
      size="md"
      bodyClassName="space-y-4"
      footer={
        <>
          {current && (
            <button
              type="button"
              className="btn-ghost btn-sm mr-auto text-coral"
              onClick={handleClear}
              disabled={saving || clearing}
            >
              {clearing ? "Clearing…" : "Clear status"}
            </button>
          )}
          <button type="button" className="btn-ghost btn-sm" onClick={onClose} disabled={saving || clearing}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={handleSave} disabled={saving || clearing}>
            {saving ? "Saving…" : "Set status"}
          </button>
        </>
      }
    >
      {!loadingCurrent && current && (
        <div className="rounded-xl bg-primary-50 text-primary-700 text-xs px-3 py-2">
          Currently set: <span className="font-semibold">{current.label}</span>
          {current.isActive ? " (active now)" : " (scheduled)"} — editing below will replace it.
        </div>
      )}

      <div>
        <label className="field-label mb-1.5 block">Status</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STATUS_TYPES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusType(opt.value)}
              className={`text-sm rounded-xl border px-3 py-2 text-left transition-colors ${
                statusType === opt.value
                  ? "border-primary bg-primary-50 text-primary-700 font-semibold"
                  : "border-line text-ink hover:bg-canvas"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {statusType === "CUSTOM" ? (
        <div>
          <label className="field-label mb-1.5 block">Custom message</label>
          <input
            autoFocus
            className="input-field"
            maxLength={160}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Working from client site"
          />
        </div>
      ) : (
        <div>
          <label className="field-label mb-1.5 block">
            Message <span className="text-faint font-normal">(optional override)</span>
          </label>
          <input
            className="input-field"
            maxLength={160}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={STATUS_TYPES.find((o) => o.value === statusType)?.label}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label mb-1.5 block">Starts</label>
          <input
            type="datetime-local"
            className="input-field"
            value={window.start}
            onChange={(e) => setWindow((w) => ({ ...w, start: e.target.value }))}
          />
        </div>
        <div>
          <label className="field-label mb-1.5 block">Ends</label>
          <input
            type="datetime-local"
            className="input-field"
            value={window.end}
            onChange={(e) => setWindow((w) => ({ ...w, end: e.target.value }))}
          />
        </div>
      </div>
      <p className="text-xs text-faint -mt-2">
        Your status becomes visible to everyone automatically at the start time, and disappears automatically at the end time.
      </p>
    </WorkspaceModal>
  );
}