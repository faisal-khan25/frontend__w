import { useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Users, Pencil, Trash2 } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import WorkspaceModal from "../../workspace/common/WorkspaceModal";
import ConfirmDialog from "../../workspace/common/ConfirmDialog";
import { deleteEvent, updateParticipant } from "../../../services/hrmsCalendarService";
import { eventTypeMeta } from "../../../utils/hrmsCalendarConstants";
import { formatDateTime, formatDateOnly } from "../../../utils/date";

const RSVP_META = {
  ACCEPTED: { label: "Accepted", className: "text-mint" },
  DECLINED: { label: "Declined", className: "text-coral" },
  TENTATIVE: { label: "Tentative", className: "text-amber" },
  PENDING: { label: "Pending", className: "text-faint" },
};

export default function EventDetailsModal({ item, onClose, onEdit, onChanged }) {
  const { user, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  if (item.kind !== "EVENT") {
    return <ReferenceDetailsModal item={item} onClose={onClose} />;
  }

  const ev = item.raw;
  const canManage = ev.isMine || ["ADMIN", "HR"].includes(role);
  const myAttendee = (ev.attendees || []).find((a) => a.userId === user?.id);
  const canRespond = !!myAttendee && !ev.isOrganizer;

  async function respond(status) {
    if (!myAttendee) return;
    setBusy(true);
    try {
      await updateParticipant(ev.id, myAttendee.id, status);
      toast.success(`Marked as ${status.toLowerCase()}`);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't update your response.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteEvent(ev.id);
      toast.success("Event cancelled");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete this event.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const meta = eventTypeMeta(ev.eventType);

  return (
    <>
      <WorkspaceModal
        title="Event details"
        onClose={onClose}
        size="md"
        footer={
          <>
            {canRespond && (
              <div className="flex gap-2 mr-auto">
                <button className="btn-outline btn-sm" disabled={busy} onClick={() => respond("DECLINED")}>
                  Decline
                </button>
                <button className="btn-outline btn-sm" disabled={busy} onClick={() => respond("TENTATIVE")}>
                  Tentative
                </button>
                <button className="btn-primary btn-sm" disabled={busy} onClick={() => respond("ACCEPTED")}>
                  Accept
                </button>
              </div>
            )}
            {canManage && (
              <>
                <button className="btn-ghost btn-sm text-coral" disabled={busy} onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </button>
                <button className="btn-outline btn-sm" disabled={busy} onClick={() => onEdit(ev)}>
                  <Pencil size={14} /> Edit
                </button>
              </>
            )}
            <button className="btn-ghost" onClick={onClose}>
              Close
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white mb-2"
              style={{ backgroundColor: meta.color }}
            >
              {meta.label}
            </span>
            <h3 className="font-display font-bold text-lg text-ink">{ev.title}</h3>
            <p className="text-sm text-muted mt-1">
              {ev.allDay ? "All day" : `${formatDateTime(ev.startsAt)} \u2013 ${formatDateTime(ev.endsAt)}`}
            </p>
          </div>

          {ev.location && (
            <div className="flex items-center gap-2 text-sm text-ink">
              <MapPin size={15} className="text-faint" /> {ev.location}
            </div>
          )}

          {ev.description && <p className="text-sm text-muted whitespace-pre-wrap">{ev.description}</p>}

          <div className="text-xs text-faint">
            Organized by <span className="text-ink font-medium">{ev.organizer?.name || "\u2014"}</span>
            {ev.creator && ev.creator.id !== ev.organizer?.id && (
              <> \u00b7 created by <span className="text-ink font-medium">{ev.creator.name}</span></>
            )}
          </div>

          {ev.attendees?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-2 flex items-center gap-1.5">
                <Users size={13} /> Participants ({ev.attendees.length})
              </p>
              <ul className="space-y-1.5">
                {ev.attendees.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{a.user?.name || "Unknown"}</span>
                    <span className={`text-xs font-medium ${RSVP_META[a.status]?.className || "text-faint"}`}>
                      {RSVP_META[a.status]?.label || a.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </WorkspaceModal>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete event"
          message={`"${ev.title}" will be cancelled and every invited participant will be notified.`}
          confirmLabel="Delete event"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

function ReferenceDetailsModal({ item, onClose }) {
  const meta = eventTypeMeta(item.kind);
  const raw = item.raw;

  return (
    <WorkspaceModal title={meta.label} onClose={onClose} size="sm" footer={<button className="btn-ghost" onClick={onClose}>Close</button>}>
      <div className="space-y-3">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
        <h3 className="font-display font-bold text-lg text-ink">{item.title}</h3>

        {item.kind === "HOLIDAY" && (
          <>
            <p className="text-sm text-muted">{formatDateOnly(raw.date)}</p>
            {raw.type && <p className="text-xs text-faint">Type: {raw.type}</p>}
            {raw.description && <p className="text-sm text-muted">{raw.description}</p>}
          </>
        )}

        {item.kind === "LEAVE" && (
          <>
            <p className="text-sm text-muted">
              {formatDateOnly(raw.fromDate)} \u2013 {formatDateOnly(raw.toDate)} ({raw.days} day{raw.days === 1 ? "" : "s"})
            </p>
            <p className="text-xs text-faint">Status: {raw.status}</p>
          </>
        )}

        {item.kind === "BIRTHDAY" && (
          <p className="text-sm text-muted">
            {raw.employee?.department ? `${raw.employee.department} \u00b7 ` : ""}
            {formatDateOnly(raw.dateOfBirth)}
          </p>
        )}
      </div>
    </WorkspaceModal>
  );
}