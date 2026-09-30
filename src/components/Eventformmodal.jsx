import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../../hooks/useAuth";
import WorkspaceModal from "../../workspace/common/WorkspaceModal";
import PeoplePicker from "../../workspace/common/PeoplePicker";
import { createEvent, updateEvent } from "../../../services/hrmsCalendarService";
import { creatableTypesForRole, visibilitiesForRole, eventTypeMeta, VISIBILITY_LABELS } from "../../../utils/hrmsCalendarConstants";
import { toLocalDatetimeInput } from "../../../utils/calendarDateUtils";

export default function EventFormModal({ event, initialStart, initialEnd, onClose, onSaved }) {
  const { role } = useAuth();
  const isEdit = !!event;
  const creatableTypes = creatableTypesForRole(role);
  const allowedVisibilities = visibilitiesForRole(role);

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventType, setEventType] = useState(event?.eventType || creatableTypes[0] || "MEETING");
  const [visibility, setVisibility] = useState(event?.visibility || allowedVisibilities[0] || "PRIVATE");
  const [location, setLocation] = useState(event?.location || "");
  const [allDay, setAllDay] = useState(!!event?.allDay);
  const [startsAt, setStartsAt] = useState(
    toLocalDatetimeInput(event?.startsAt || initialStart || new Date().toISOString())
  );
  const [endsAt, setEndsAt] = useState(
    toLocalDatetimeInput(event?.endsAt || initialEnd || new Date(Date.now() + 60 * 60 * 1000).toISOString())
  );
  const [color, setColor] = useState(event?.color || eventTypeMeta(eventType).color);
  const [participants, setParticipants] = useState(
    (event?.attendees || []).map((a) => ({ id: a.userId, name: a.user?.name, email: a.user?.email }))
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) return setFormError("Title is required.");
    if (!startsAt || !endsAt) return setFormError("Start and end time are required.");
    if (new Date(endsAt) < new Date(startsAt)) return setFormError("End time must be after the start time.");

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      eventType,
      visibility,
      location: location.trim() || undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      allDay,
      color,
      participantIds: participants.map((p) => p.id),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateEvent(event.id, payload);
        toast.success("Event updated");
      } else {
        await createEvent(payload);
        toast.success("Event created");
      }
      onSaved();
    } catch (err) {
      const message = err.response?.data?.error || `Couldn't ${isEdit ? "update" : "create"} the event.`;
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      title={isEdit ? "Edit event" : "New event"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="btn-primary" disabled={saving}>
            {saving ? "Saving\u2026" : isEdit ? "Save changes" : "Create event"}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-xl bg-coral-bg text-coral text-sm px-3 py-2">{formError}</div>
        )}

        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Title</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sprint planning"
            maxLength={200}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Event type</label>
            <select
              className="input-field"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setColor(eventTypeMeta(e.target.value).color);
              }}
            >
              {creatableTypes.map((t) => (
                <option key={t} value={t}>
                  {eventTypeMeta(t).label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Visibility</label>
            <select className="input-field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {allowedVisibilities.map((v) => (
                <option key={v} value={v}>
                  {VISIBILITY_LABELS[v] || v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Starts</label>
            <input
              type="datetime-local"
              className="input-field"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Ends</label>
            <input
              type="datetime-local"
              className="input-field"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          All day
        </label>

        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Location</label>
          <input
            className="input-field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Conference Room B, or a meeting link"
            maxLength={255}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Description</label>
          <textarea
            className="input-field min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes or agenda"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Participants</label>
          <PeoplePicker value={participants} onChange={setParticipants} placeholder="Invite colleagues" />
          <p className="text-[11px] text-faint mt-1">
            Invited people get a notification and can accept, decline, or mark tentative.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded-lg border border-line cursor-pointer"
          />
        </div>
      </form>
    </WorkspaceModal>
  );
}