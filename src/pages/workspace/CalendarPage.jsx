import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, Plus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { calendarApi } from "../../lib/calendarApi";
import ErrorState from "../../components/workspace/common/ErrorState";
import EventFormModal from "../../components/workspace/calendar/EventFormModal";
import { formatDateTime } from "../../utils/date";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const today = new Date();
  const [params] = useSearchParams();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [selectedDay, setSelectedDay] = useState(today);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString();
    const end   = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
    calendarApi
      .listEvents({ start, end })
      .then((res) => setEvents(res.events || []))
      .catch(() => setError("Couldn't load calendar events."))
      .finally(() => setLoading(false));
  }, [viewDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const eventId = params.get("event");
    if (!eventId) return;
    calendarApi
      .getEvent(eventId)
      .then((ev) => {
        const start = new Date(ev.startsAt);
        setViewDate(new Date(start.getFullYear(), start.getMonth(), 1));
        setSelectedDay(start);
      })
      .catch(() => toast.error("Couldn't open that event"));
  }, [params]);

  function prevMonth() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }
  function nextMonth() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));

  const dayEvents = events.filter((ev) => {
    const start = new Date(ev.startsAt);
    return isSameDay(start, selectedDay);
  });

  async function handleDeleteEvent(id) {
    if (!window.confirm("Delete this event?")) return;
    try {
      await calendarApi.deleteEvent(id);
      toast.success("Event deleted");
      load();
    } catch { toast.error("Couldn't delete event"); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Calendar size={20} className="text-primary-500" /> Calendar
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost btn-sm" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setFormModal({})} className="btn-primary btn-sm">
            <Plus size={14} /> New event
          </button>
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={load} />}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-primary-50"><ChevronLeft size={18} /></button>
            <p className="font-display font-bold text-ink">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-primary-50"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-line">
            {DAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-faint">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="border-r border-b border-line min-h-[60px]" />;
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const dayEvts = events.filter((ev) => isSameDay(new Date(ev.startsAt), day));
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`border-r border-b border-line min-h-[60px] p-1.5 flex flex-col items-start text-left transition-colors
                    ${isSelected ? "bg-primary-50" : "hover:bg-canvas"}
                  `}
                >
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${isToday ? "bg-primary text-white" : isSelected ? "text-primary-600" : "text-ink"}`}>
                    {day.getDate()}
                  </span>
                  {dayEvts.slice(0, 2).map((ev) => (
                    <span key={ev.id} className="text-[10px] font-medium text-white rounded px-1 mb-0.5 truncate w-full"
                      style={{ backgroundColor: ev.color || "#6F66FF" }}>
                      {ev.title}
                    </span>
                  ))}
                  {dayEvts.length > 2 && (
                    <span className="text-[10px] text-faint">+{dayEvts.length - 2} more</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-ink text-sm">
              {selectedDay.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <button
              onClick={() => setFormModal({ initialStart: selectedDay.toISOString() })}
              className="btn-outline btn-sm"
            >
              <Plus size={13} /> Add
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : dayEvents.length === 0 ? (
            <p className="text-sm text-faint">No events on this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-line overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: ev.color || "#6F66FF" }} />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-ink">{ev.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatDateTime(ev.startsAt)} – {formatDateTime(ev.endsAt)}
                    </p>
                    {ev.location && <p className="text-xs text-faint mt-0.5">{ev.location}</p>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setFormModal({ event: ev })} className="text-xs text-primary-600 hover:underline">Edit</button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-coral hover:underline">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {formModal !== null && (
        <EventFormModal
          event={formModal.event}
          initialStart={formModal.initialStart}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); load(); }}
        />
      )}
    </div>
  );
}