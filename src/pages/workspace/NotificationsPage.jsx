import { useCallback, useEffect, useState } from "react";
import {
  Bell, CheckCheck, Trash2, RefreshCw, Megaphone, Umbrella,
  Clock, Wallet, ListChecks, Info, ChevronLeft, ChevronRight,
} from "lucide-react";
import { workspaceNotificationApi } from "../../lib/index";
import ErrorState from "../../components/workspace/common/ErrorState";
import EmptyState from "../../components/workspace/common/EmptyState";
import { formatTimestamp } from "../../utils/date";

const TYPE_ICON = {
  ANNOUNCEMENT: Megaphone,
  LEAVE_APPROVAL: Umbrella,
  ATTENDANCE_ALERT: Clock,
  PAYROLL: Wallet,
  TASK: ListChecks,
  GENERAL: Info,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    workspaceNotificationApi
      .getMyNotifications({ page, pageSize: 20 })
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        setPagination(res.pagination || null);
      })
      .catch(() => setError("Couldn't load notifications."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkRead(id) {
    setBusy(true);
    try {
      await workspaceNotificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } finally { setBusy(false); }
  }

  async function handleMarkAllRead() {
    setBusy(true);
    try {
      await workspaceNotificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally { setBusy(false); }
  }

  async function handleDelete(id) {
    setBusy(true);
    try {
      await workspaceNotificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Bell size={20} className="text-primary-500" /> Notifications
          {unreadCount > 0 && (
            <span className="badge-coral !px-2 !py-0.5 text-[11px]">{unreadCount} new</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost btn-sm" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={busy} className="btn-outline btn-sm flex items-center gap-1.5">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted p-6">
          <RefreshCw size={14} className="animate-spin" /> Loading notifications…
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <EmptyState icon={Bell} title="All caught up" description="No notifications yet." />
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                  n.isRead ? "border-line" : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.isRead ? "bg-canvas" : "bg-primary-50"}`}>
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-faint mt-1">{formatTimestamp(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={busy}
                      className="p-1.5 rounded-lg text-faint hover:text-primary hover:bg-primary-50 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={busy}
                    className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-faint">Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">
              <ChevronLeft size={14} /> Prev
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
