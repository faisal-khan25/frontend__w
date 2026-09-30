import { useState } from "react";
import toast from "react-hot-toast";
import WorkspaceModal from "../common/WorkspaceModal";
import PeoplePicker from "../common/PeoplePicker";
import { calendarApi } from "../../../lib/calendarApi";

const COLORS = [
  { value: "#6F66FF", name: "Violet" },
  { value: "#2BC48A", name: "Mint" },
  { value: "#3B82F6", name: "Sky" },
  { value: "#F5A524", name: "Amber" },
  { value: "#FF6B6B", name: "Coral" },
];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventFormModal({ event, initialStart, initialEnd, onClose, onSaved }) {
  const isEdit = Boolean(event);
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.startsAt || initialStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.endsAt || initialEnd));
  const [color, setColor] = useState(event?.color || COLORS[0].value);
  const [attendees, setAttendees] = useState(
    (event?.attendees || []).map((a) => a.user).filter(Boolean)
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) { toast.error("Event title is required"); return; }
    if (!startsAt || !endsAt) { toast.error("Start and end time are required"); return; }
    if (new Date(endsAt) < new Date(startsAt)) { toast.error("End time must be after start time"); return; }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description,
      location,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      allDay,
      color,
      attendeeIds: attendees.map((a) => a.id),
    };
    try {
      if (isEdit) {
        await calendarApi.updateEvent(event.id, payload);
        toast.success("Event updated");
      } else {
        await calendarApi.createEvent(payload);
        toast.success("Event created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      title={isEdit ? "Edit event" : "New event"}
      onClose={onClose}
      size="md"
      bodyClassName="space-y-4"
      footer={
        <>
          <button className="btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </button>
        </>
      }
    >
      <div>
        <label className="field-label mb-1.5 block">Title</label>
        <input autoFocus className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label mb-1.5 block">Starts</label>
          <input type="datetime-local" className="input-field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="field-label mb-1.5 block">Ends</label>
          <input type="datetime-local" className="input-field" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
        All-day event
      </label>

      <div>
        <label className="field-label mb-1.5 block">Location</label>
        <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add a location" />
      </div>

      <div>
        <label className="field-label mb-1.5 block">Description</label>
        <textarea className="input-field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description" />
      </div>

      <div>
        <label className="field-label mb-1.5 block">Attendees</label>
        <PeoplePicker value={attendees} onChange={setAttendees} placeholder="Invite people" />
      </div>

      <div>
        <label className="field-label mb-1.5 block">Color</label>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => setColor(c.value)}
              className={`w-7 h-7 rounded-full transition-transform ${color === c.value ? "ring-2 ring-offset-2 ring-ink scale-105" : ""}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>
    </WorkspaceModal>
  );
}
