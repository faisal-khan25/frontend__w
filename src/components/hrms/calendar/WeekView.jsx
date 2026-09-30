import { Plus } from "lucide-react";
import { addDays, dateKey, isSameDay, startOfWeek } from "../../../utils/calendarDateUtils";
import { formatDateTime } from "../../../utils/date";

export default function WeekView({ viewDate, today, itemsByDay, onOpenItem, onSlotCreate }) {
  const start = startOfWeek(viewDate);
  const days  = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
      {days.map((day) => {
        const items   = itemsByDay.get(dateKey(day)) || [];
        const isToday = isSameDay(day, today);

        return (
          <div
            key={dateKey(day)}
            className={`card overflow-hidden ${isToday ? "ring-2 ring-primary/40" : ""}`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-line">
              <div>
                <p className="text-[11px] font-semibold text-faint uppercase">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className={`text-sm font-bold ${isToday ? "text-primary-600" : "text-ink"}`}>
                  {day.getDate()}
                </p>
              </div>
              <button
                onClick={() => onSlotCreate(day)}
                className="p-1 rounded-lg hover:bg-primary-50 text-faint hover:text-primary-600"
                aria-label={`Add event on ${dateKey(day)}`}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="p-2 space-y-1.5 min-h-[110px]">
              {items.length === 0 && (
                <p className="text-[11px] text-faint px-1 py-2">No items</p>
              )}
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onOpenItem(it)}
                  className="w-full text-left rounded-lg overflow-hidden border border-line
                    hover:border-primary-200 transition-colors"
                >
                  <div className="h-1" style={{ backgroundColor: it.color }} />
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-semibold text-ink truncate">{it.title}</p>
                    {!it.allDay && (
                      <p className="text-[10px] text-faint">
                        {formatDateTime(it.startsAt).split(",").pop().trim()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
