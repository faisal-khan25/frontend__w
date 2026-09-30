import { MessageSquare, Mail, FolderOpen, Calendar, Users, Video, Folder, File as FileIcon } from "lucide-react";

export const MODULE_CONFIG = {
  chat: { label: "Chat", icon: MessageSquare },
  mail: { label: "Mail", icon: Mail },
  drive: { label: "Drive", icon: FolderOpen },
  calendar: { label: "Calendar", icon: Calendar },
  employees: { label: "Employees", icon: Users },
  meetings: { label: "Meetings", icon: Video },
};

function formatResultDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function RowIcon({ item }) {
  if (item.user?.profileImage) {
    return <img src={item.user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  const Icon = item.module === "drive" ? (item.type === "folder" ? Folder : FileIcon) : MODULE_CONFIG[item.module]?.icon;
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
      {Icon ? <Icon size={15} /> : null}
    </div>
  );
}

export function SearchResultRow({ item, onClick, busy }) {
  return (
    <button
      onClick={() => onClick(item)}
      disabled={busy}
      className="w-full flex items-start gap-3 text-left px-4 py-2.5 hover:bg-primary-50 transition-colors disabled:opacity-60"
    >
      <div className="mt-0.5">
        <RowIcon item={item} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink truncate">{item.title || "(untitled)"}</p>
          {item.date && <span className="text-[11px] text-faint shrink-0">{formatResultDate(item.date)}</span>}
        </div>
        {item.snippet && <p className="text-xs text-muted truncate mt-0.5">{item.snippet}</p>}
        {item.user?.name && item.module !== "employees" && (
          <p className="text-[11px] text-faint truncate mt-0.5">{item.user.name}</p>
        )}
      </div>
    </button>
  );
}

export function GroupedSearchResults({ results, counts, onItemClick, onViewAll, busyItemId }) {
  const modules = Object.keys(MODULE_CONFIG).filter((m) => (results[m] || []).length > 0);

  return (
    <div className="divide-y divide-line">
      {modules.map((moduleName) => {
        const { label, icon: Icon } = MODULE_CONFIG[moduleName];
        const items = results[moduleName] || [];
        const total = counts?.[moduleName] ?? items.length;

        return (
          <div key={moduleName} className="py-1.5">
            <div className="flex items-center gap-1.5 px-4 pt-1.5 pb-1 text-xs font-semibold text-faint uppercase tracking-wide">
              <Icon size={12} /> {label}
            </div>
            {items.map((item) => (
              <SearchResultRow
                key={`${item.module}-${item.type}-${item.id}`}
                item={item}
                onClick={onItemClick}
                busy={busyItemId === `${item.module}-${item.id}`}
              />
            ))}
            {total > items.length && (
              <button
                onClick={() => onViewAll(moduleName)}
                className="w-full text-left px-4 py-2 text-xs font-medium text-primary-600 hover:underline"
              >
                View all {total} results in {label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ModuleResultList({ items, onItemClick, busyItemId }) {
  return (
    <div className="divide-y divide-line">
      {items.map((item) => (
        <SearchResultRow
          key={`${item.module}-${item.type}-${item.id}`}
          item={item}
          onClick={onItemClick}
          busy={busyItemId === `${item.module}-${item.id}`}
        />
      ))}
    </div>
  );
}

export default GroupedSearchResults;