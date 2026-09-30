import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video, Plus, Clock, Users, RefreshCw, Calendar, Play,
  History, ChevronRight, Loader2, X,
} from "lucide-react";
import { meetApi } from "../../lib/meetApi";
import ErrorState from "../../components/workspace/common/ErrorState";
import EmptyState from "../../components/workspace/common/EmptyState";
import { formatDateTime, formatTimestamp } from "../../utils/date";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";

const STATUS_STYLE = {
  ACTIVE: "bg-mint-bg text-mint",
  SCHEDULED: "bg-primary-50 text-primary-600",
  ENDED: "bg-canvas text-faint",
};
const STATUS_LABEL = { ACTIVE: "Live", SCHEDULED: "Scheduled", ENDED: "Ended" };

function CreateMeetingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const meeting = await meetApi.createMeeting({
        title: title.trim() || undefined,
        scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      toast.success(scheduleMode ? "Meeting scheduled" : "Meeting created");
      onCreated(meeting);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't create meeting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-ink flex items-center gap-2">
            <Video size={18} className="text-primary-500" />
            New Meeting
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-faint hover:bg-primary-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-faint uppercase tracking-wide block mb-1.5">
              Meeting title (optional)
            </label>
            <input
              autoFocus
              className="input-field"
              placeholder="Team standup, Design review…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="flex rounded-xl border border-line overflow-hidden">
            <button
              type="button"
              onClick={() => setScheduleMode(false)}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                !scheduleMode ? "bg-primary text-white" : "text-muted hover:bg-primary-50"
              }`}
            >
              <Play size={14} /> Start now
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode(true)}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                scheduleMode ? "bg-primary text-white" : "text-muted hover:bg-primary-50"
              }`}
            >
              <Calendar size={14} /> Schedule
            </button>
          </div>

          {scheduleMode && (
            <div>
              <label className="text-xs font-medium text-faint uppercase tracking-wide block mb-1.5">
                Date & time
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required={scheduleMode}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Creating…</>
              ) : scheduleMode ? (
                <><Calendar size={14} /> Schedule</>
              ) : (
                <><Video size={14} /> Start meeting</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MeetingCard({ meeting, onJoin }) {
  const navigate = useNavigate();

  function handleClick() {
    if (meeting.status === "ACTIVE") {
      onJoin(meeting.id);
    } else if (meeting.status === "SCHEDULED") {
      navigate(`/workspace/meet/${meeting.id}`);
    }
  }

  return (
    <div className="card card-pad flex items-start gap-4 hover:shadow-card transition-shadow">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          meeting.status === "ACTIVE"
            ? "bg-mint-bg"
            : meeting.status === "SCHEDULED"
            ? "bg-primary-50"
            : "bg-canvas"
        }`}
      >
        <Video
          size={20}
          className={
            meeting.status === "ACTIVE"
              ? "text-mint"
              : meeting.status === "SCHEDULED"
              ? "text-primary-500"
              : "text-faint"
          }
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-ink text-sm truncate">{meeting.title || "Team Meeting"}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[meeting.status]}`}>
            {meeting.status === "ACTIVE" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint mr-1 animate-pulse" />}
            {STATUS_LABEL[meeting.status]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-faint flex items-center gap-1">
            <Users size={12} /> {meeting.participantCount} participant{meeting.participantCount !== 1 ? "s" : ""}
          </span>
          {meeting.scheduledAt && (
            <span className="text-xs text-faint flex items-center gap-1">
              <Clock size={12} /> {formatDateTime(meeting.scheduledAt)}
            </span>
          )}
          <span className="text-xs text-faint">
            By {meeting.organizer?.name || "Unknown"}
          </span>
        </div>
      </div>

      {meeting.status !== "ENDED" && (
        <button
          onClick={handleClick}
          className={`btn-sm shrink-0 ${meeting.status === "ACTIVE" ? "btn-primary" : "btn-outline"}`}
        >
          {meeting.status === "ACTIVE" ? "Join" : "View"}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function MeetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState("upcoming");
  const [meetings, setMeetings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (tab === "upcoming") {
        result = await meetApi.listMyMeetings({ pageSize: 30 });
      } else {
        result = await meetApi.getMeetingHistory({ pageSize: 30 });
      }
      setMeetings(result.meetings || []);
      setPagination(result.pagination || null);
    } catch {
      setError("Couldn't load meetings.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function handleCreated(meeting) {
    setShowCreate(false);
    if (meeting.status === "ACTIVE") {
      navigate(`/workspace/meet/${meeting.id}`);
    } else {
      load();
    }
  }

  function handleJoin(id) {
    navigate(`/workspace/meet/${id}`);
  }

  const activeMeetings = meetings.filter((m) => m.status === "ACTIVE");
  const scheduledMeetings = meetings.filter((m) => m.status === "SCHEDULED");

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <Video size={22} className="text-primary-500" /> Meet
          </h1>
          <p className="text-sm text-muted mt-0.5">Start an instant call or schedule a meeting.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost btn-sm" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
            <Plus size={14} /> New meeting
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-line">
        {[
          { key: "upcoming", label: "Upcoming & Active", icon: Video },
          { key: "history", label: "History", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-primary text-primary-600"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card card-pad animate-pulse flex gap-4 items-center">
              <div className="w-11 h-11 rounded-xl bg-line shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-line rounded w-2/5" />
                <div className="h-2.5 bg-line rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && meetings.length === 0 && (
        <EmptyState
          icon={Video}
          title={tab === "upcoming" ? "No active or upcoming meetings" : "No meeting history yet"}
          description={
            tab === "upcoming"
              ? "Start an instant meeting or schedule one for later."
              : "Your past meetings will appear here once you've joined at least one."
          }
          action={
            tab === "upcoming" && (
              <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
                <Plus size={14} /> New meeting
              </button>
            )
          }
        />
      )}

      {!loading && !error && meetings.length > 0 && (
        <div className="space-y-6">
          {tab === "upcoming" && activeMeetings.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-faint uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" /> Live now
              </p>
              <div className="space-y-3">
                {activeMeetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onJoin={handleJoin} />
                ))}
              </div>
            </section>
          )}

          {tab === "upcoming" && scheduledMeetings.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
                Scheduled
              </p>
              <div className="space-y-3">
                {scheduledMeetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onJoin={handleJoin} />
                ))}
              </div>
            </section>
          )}

          {tab === "history" && (
            <div className="space-y-3">
              {meetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} onJoin={handleJoin} />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateMeetingModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
