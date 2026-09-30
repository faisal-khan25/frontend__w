import { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw, CheckCheck, Megaphone, Umbrella, Clock, Wallet, ListChecks, Info } from "lucide-react";
import * as notificationService from "../../services/notificationService";

const TYPE_ICON = {
  ANNOUNCEMENT: Megaphone,
  LEAVE_APPROVAL: Umbrella,
  ATTENDANCE_ALERT: Clock,
  PAYROLL: Wallet,
  TASK: ListChecks,
  GENERAL: Info,
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsWidget() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getMyNotifications({ pageSize: 8 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id) {
    setBusy(true);
    try {
      await notificationService.markAsRead(id);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkAllRead() {
    setBusy(true);
    try {
      await notificationService.markAllAsRead();
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="notifications" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Bell size={18} className="text-primary" /> Notifications
          {unreadCount > 0 && <span className="badge-coral !px-2 !py-0.5 text-[11px]">{unreadCount} new</span>}
        </h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={busy} className="text-xs text-primary hover:underline flex items-center gap-1">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-faint">You're all caught up. No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  n.isRead ? "border-line" : "border-primary-200 bg-primary-50"
                }`}
              >
                <Icon size={16} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-faint mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    disabled={busy}
                    className="text-[11px] text-primary hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
