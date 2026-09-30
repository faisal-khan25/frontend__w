import { ChevronLeft, ChevronRight, RefreshCw, Plus } from "lucide-react";
import { startOfWeek, endOfWeek } from "../../../utils/calendarDateUtils";
import { EVENT_TYPES, eventTypeMeta, SCOPE_LABELS } from "../../../utils/hrmsCalendarConstants";

const VIEW_MODES = [
  { id: "month", label: "Month" },
  { id: "week",  label: "Week"  },
  { id: "day",   label: "Day"   },
];

function rangeLabel(viewMode, viewDate) {
  if (viewMode === "month") {
    return viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (viewMode === "week") {
    const start = startOfWeek(viewDate);
    const end   = endOfWeek(viewDate);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel   = end.toLocaleDateString(undefined, {
      month: sameMonth ? undefined : "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
  }
  return viewDate.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function CalendarToolbar({
  viewMode,
  onViewModeChange,
  viewDate,
  onPrev,
  onNext,
  onToday,
  loading,
  onRefresh,
  scope,
  onScopeChange,
  availableScopes = [],
  eventType,
  onEventTypeChange,
  onNewEvent,
}) {
  return (
    <div className="card card-pad flex flex-wrap items-center gap-3">

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-primary-50 text-muted"
          aria-label="Previous period"
        >
          <ChevronLeft size={18} />
        </button>
        <button onClick={onToday} className="btn-outline btn-sm">
          Today
        </button>
        <button
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-primary-50 text-muted"
          aria-label="Next period"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="font-display font-bold text-ink text-sm min-w-[140px]">
        {rangeLabel(viewMode, viewDate)}
      </p>

      <div className="flex items-center rounded-xl border border-line p-0.5 bg-canvas">
        {VIEW_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onViewModeChange(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${viewMode === m.id
                ? "bg-primary text-white"
                : "text-muted hover:text-ink"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto flex-wrap">

        {availableScopes.length > 1 && (
          <select
            value={scope}
            onChange={(e) => onScopeChange(e.target.value)}
            className="input-field !py-1.5 !text-xs !w-auto"
            aria-label="Calendar scope"
          >
            {availableScopes.map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABELS[s] || s}
              </option>
            ))}
          </select>
        )}

        <select
          value={eventType}
          onChange={(e) => onEventTypeChange(e.target.value)}
          className="input-field !py-1.5 !text-xs !w-auto"
          aria-label="Filter by event type"
        >
          <option value="">All types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {eventTypeMeta(t).label}
            </option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          className="btn-ghost btn-sm"
          title="Refresh"
          aria-label="Refresh calendar"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>

        <button onClick={onNewEvent} className="btn-primary btn-sm">
          <Plus size={14} /> New event
        </button>
      </div>
    </div>
  );
}
