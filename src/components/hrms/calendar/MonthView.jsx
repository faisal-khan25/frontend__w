import { buildMonthGrid, dateKey, isSameDay, isSameMonth, WEEKDAY_SHORT } from "../../../utils/calendarDateUtils";

const MAX_VISIBLE_PER_DAY = 3;

export default function MonthView({ viewDate, today, itemsByDay, onSelectDay, onOpenItem, onSlotCreate }) {
  const cells = buildMonthGrid(viewDate);

  return (
    <div className="card overflow-hidden">

      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-faint">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const inMonth  = isSameMonth(day, viewDate);
          const isToday  = isSameDay(day, today);
          const items    = itemsByDay.get(dateKey(day)) || [];
          const visible  = items.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = items.length - visible.length;

          return (
            <div
              key={dateKey(day)}
              className={`border-r border-b border-line min-h-[92px] p-1.5 flex flex-col items-start
                text-left transition-colors cursor-pointer
                ${inMonth ? "bg-surface hover:bg-canvas" : "bg-canvas/60 hover:bg-canvas"}`}
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onSlotCreate(day)}
            >
              <span
                className={`text-xs font-semibold w-6 h-6 flex items-center justify-center
                  rounded-full mb-1 shrink-0
                  ${isToday
                    ? "bg-primary text-white"
                    : inMonth ? "text-ink" : "text-faint"}`}
              >
                {day.getDate()}
              </span>

              <div className="w-full space-y-0.5">
                {visible.map((it) => (
                  <button
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); onOpenItem(it); }}
                    className="w-full text-left text-[10px] font-medium text-white rounded px-1 py-0.5 truncate block"
                    style={{ backgroundColor: it.color }}
                    title={it.title}
                  >
                    {it.title}
                  </button>
                ))}

                {overflow > 0 && (
                  <p className="text-[10px] text-faint px-1">+{overflow} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
