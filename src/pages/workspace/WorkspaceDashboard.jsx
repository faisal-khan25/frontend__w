import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Table, Presentation, Upload, FolderPlus, Mail, CalendarPlus,
  CheckSquare, Umbrella, Bell as BellIcon, MessageSquare, Video,
  FolderOpen, Clock,
} from "lucide-react";
import { dashboardApi } from "../../lib/api";
import { SkeletonList } from "../../components/workspace/common/Skeleton";
import ErrorState from "../../components/workspace/common/ErrorState";
import { formatTimestamp, formatDateTime } from "../../utils/date";
import useAuth from "../../hooks/useAuth";
import NewDocModal from "../../components/workspace/common/NewDocModal";
import NewFolderModal from "../../components/workspace/drive/NewFolderModal";
import UploadFileModal from "../../components/workspace/drive/UploadFileModal";
import ComposeModal from "../../components/workspace/mail/ComposeModal";
import EventFormModal from "../../components/workspace/calendar/EventFormModal";
import { meetApi } from "../../lib/meetApi";

const QUICK_ACTIONS = [
  { key: "doc", icon: FileText, label: "New Document" },
  { key: "sheet", icon: Table, label: "New Spreadsheet" },
  { key: "slide", icon: Presentation, label: "New Presentation" },
  { key: "upload", icon: Upload, label: "Upload File" },
  { key: "folder", icon: FolderPlus, label: "New Folder" },
  { key: "compose", icon: Mail, label: "Compose Email" },
  { key: "event", icon: CalendarPlus, label: "New Event" },
  { key: "meet", icon: Video, label: "New Meeting" },
];

export default function WorkspaceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    dashboardApi
      .getMyDashboard()
      .then(setData)
      .catch(() => setError("Couldn't load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleQuickAction(key) {
    if (key === "doc" || key === "sheet" || key === "slide") {
      setModal({ type: "newDoc", kind: key });
    } else if (key === "meet") {
      meetApi.createMeeting({ title: "Instant Meeting" })
        .then((meeting) => navigate(`/workspace/meet/${meeting.id}`))
        .catch(() => navigate("/workspace/meet"));
    } else {
      setModal({ type: key });
    }
  }

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8 pb-10">
      <section className="bg-gradient-to-br from-primary-700 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
          <p className="eyebrow text-white/70">{greeting}</p>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-white mt-2 max-w-xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-3 text-white/70 text-[15px] max-w-lg">
            Everything you need to work together, communicate and get things done — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/workspace/mail")}
              className="btn bg-white text-primary-700 hover:bg-white/90"
            >
              <Mail size={16} /> Open Mail
            </button>
            <button
              onClick={() => navigate("/workspace/drive")}
              className="btn bg-white/10 text-white border border-white/25 hover:bg-white/15"
            >
              <FolderOpen size={16} /> Open Drive
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-8">
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-4">Work better together</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.key}
                onClick={() => handleQuickAction(qa.key)}
                className="card card-hover card-pad flex flex-col items-center gap-2 py-5 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <qa.icon size={18} className="text-primary-600" />
                </div>
                <span className="text-xs font-medium text-ink leading-tight">{qa.label}</span>
              </button>
            ))}
          </div>
        </section>

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card card-pad"><SkeletonList rows={4} /></div>
          <div className="card card-pad"><SkeletonList rows={4} /></div>
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CheckSquare} label="Open tasks" value={data.tasks.open} sub={`${data.tasks.overdue} overdue`} tone="primary" />
            <StatCard icon={Umbrella} label="Pending leaves" value={data.leaves.pending} tone="amber" />
            <StatCard icon={BellIcon} label="Unread notifications" value={data.notifications.unread} tone="coral" onClick={() => navigate("/workspace/notifications")} />
            <StatCard icon={MessageSquare} label="Unread chats" value={data.chat.unreadMessages} sub={`${data.chat.unreadConversations} conversations`} tone="mint" onClick={() => navigate("/workspace/chat")} />
          </section>

          <h2 className="font-display text-lg font-bold text-ink -mb-2">Your recent work</h2>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="card card-pad">
              <SectionHeader icon={FolderOpen} title="Recent files" onViewAll={() => navigate("/workspace/drive")} />
              {data.drive.recent.length === 0 ? (
                <EmptyRow text="No files yet. Upload something to get started." />
              ) : (
                <div className="divide-y divide-line">
                  {data.drive.recent.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/workspace/drive?open=${f.id}`)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-primary-50/50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-ink truncate">{f.name}</span>
                      <span className="text-xs text-faint shrink-0 ml-3">{formatTimestamp(f.updatedAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card card-pad">
              <SectionHeader icon={Clock} title="Upcoming events" onViewAll={() => navigate("/workspace/calendar")} />
              {data.calendar.upcoming.length === 0 ? (
                <EmptyRow text="Nothing on your calendar this week." />
              ) : (
                <div className="divide-y divide-line">
                  {data.calendar.upcoming.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/workspace/calendar?event=${ev.id}`)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-primary-50/50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-ink truncate">{ev.title}</span>
                      <span className="text-xs text-faint shrink-0 ml-3">{formatDateTime(ev.startsAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card card-pad">
              <SectionHeader icon={Video} title="Upcoming meetings" onViewAll={() => navigate("/workspace/meet")} />
              {data.meetings.upcoming.length === 0 ? (
                <EmptyRow text="No meetings scheduled." />
              ) : (
                <div className="divide-y divide-line">
                  {data.meetings.upcoming.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/workspace/meet/${m.id}`)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-primary-50/50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-ink truncate">{m.title || "Meeting"}</span>
                      <span className="text-xs text-faint shrink-0 ml-3">{formatDateTime(m.scheduledAt || m.startsAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card card-pad">
              <SectionHeader icon={BellIcon} title="Recent activity" onViewAll={() => navigate("/workspace/notifications")} />
              <EmptyRow text="Open Notifications to see the full activity feed." />
            </section>
          </div>
        </>
      )}
      </div>

      {modal?.type === "newDoc" && (
        <NewDocModal kind={modal.kind} onClose={() => setModal(null)} />
      )}
      {modal?.type === "folder" && (
        <NewFolderModal parentId={null} onClose={() => setModal(null)} onCreated={load} />
      )}
      {modal?.type === "upload" && (
        <UploadFileModal parentId={null} onClose={() => setModal(null)} onUploaded={load} />
      )}
      {modal?.type === "compose" && (
        <ComposeModal onClose={() => setModal(null)} onSent={load} />
      )}
      {modal?.type === "event" && (
        <EventFormModal onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone, onClick }) {
  const tones = {
    primary: "bg-primary-50 text-primary-600",
    amber: "bg-amber-bg text-amber",
    coral: "bg-coral-bg text-coral",
    mint: "bg-mint-bg text-mint",
  };
  return (
    <button onClick={onClick} className={`card card-pad text-left ${onClick ? "card-hover" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-display font-bold text-ink">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-faint mt-0.5">{sub}</p>}
    </button>
  );
}

function SectionHeader({ icon: Icon, title, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary-500" />
        <h2 className="font-display font-bold text-ink text-sm">{title}</h2>
      </div>
      <button onClick={onViewAll} className="text-xs font-medium text-primary-600 hover:underline">
        View all
      </button>
    </div>
  );
}

function EmptyRow({ text }) {
  return <p className="text-sm text-muted py-6 text-center">{text}</p>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}