import { Plus } from "lucide-react";
import { CalendarDays } from "lucide-react";
import EmptyState from "../../workspace/common/EmptyState";
import { formatDateTime } from "../../../utils/date";

export default function DayView({ viewDate, items, onOpenItem, onSlotCreate }) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-bold text-ink">
          {viewDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <button onClick={() => onSlotCreate(viewDate)} className="btn-outline btn-sm">
          <Plus size={13} /> Add event
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="No events, leave, holidays or birthdays on this day."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-line overflow-hidden cursor-pointer hover:border-primary-200 transition-colors"
              onClick={() => onOpenItem(it)}
            >
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ backgroundColor: it.color }} />
                <div className="p-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{it.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {it.allDay ? "All day" : `${formatDateTime(it.startsAt)} \u2013 ${formatDateTime(it.endsAt)}`}
                  </p>
                  {it.kind === "EVENT" && it.raw.location && (
                    <p className="text-xs text-faint mt-0.5 truncate">{it.raw.location}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}