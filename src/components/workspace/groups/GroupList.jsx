import { Search as SearchIcon, Plus, Users, Loader2 } from "lucide-react";
import GroupAvatar from "./GroupAvatar";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";
import { formatTimestamp } from "../../../utils/date";

export default function GroupList({
  groups,
  loading,
  error,
  activeGroupId,
  onSelect,
  onCreate,
  canCreateGroup,
  search,
  onSearchChange,
  onRetry,
  className = "",
}) {
  return (
    <div className={`flex flex-col border-r border-line bg-surface shrink-0 w-72 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-line gap-2">
        <h1 className="font-display font-bold text-ink flex items-center gap-2 min-w-0">
          <Users size={18} className="text-primary-500 shrink-0" /> Groups
        </h1>
        {canCreateGroup && (
          <button onClick={onCreate} className="btn-primary btn-sm shrink-0">
            <Plus size={14} /> New
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-line">
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search groups"
            aria-label="Search groups"
            className="w-full rounded-pill border border-line bg-canvas pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10 text-faint">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        {!loading && error && <ErrorState description={error} onRetry={onRetry} />}

        {!loading && !error && groups.length === 0 && (
          <EmptyState
            icon={Users}
            title={search ? "No groups match that search" : "No groups yet"}
            description={
              search
                ? "Try a different name."
                : "Create a group to start a team conversation."
            }
          />
        )}

        {!loading &&
          !error &&
          groups.map((group) => {
            const isActive = group.id === activeGroupId;
            const preview = group.lastMessage;
            const previewText = preview
              ? preview.messageType === "SYSTEM"
                ? preview.message
                : `${preview.senderName ? `${preview.senderName}: ` : ""}${
                    preview.message || "Attachment"
                  }`
              : "No messages yet";

            return (
              <button
                key={group.id}
                onClick={() => onSelect(group.id)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left border-b border-line/60 transition-colors ${
                  isActive ? "bg-primary-50" : "hover:bg-primary-50/60"
                }`}
              >
                <GroupAvatar name={group.name} icon={group.icon} iconType={group.iconType} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm ${
                        group.unreadCount > 0
                          ? "font-bold text-ink"
                          : "font-semibold text-ink"
                      }`}
                    >
                      {group.name}
                    </span>
                    <span className="text-[11px] text-faint shrink-0">
                      {formatTimestamp(group.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span
                      className={`truncate text-xs ${
                        group.unreadCount > 0 ? "text-ink font-medium" : "text-muted"
                      }`}
                    >
                      {previewText}
                    </span>
                    {group.unreadCount > 0 && (
                      <span
                        className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-pill bg-primary text-white text-[11px] font-bold flex items-center justify-center"
                        aria-label={`${group.unreadCount} unread messages`}
                      >
                        {group.unreadCount > 99 ? "99+" : group.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
