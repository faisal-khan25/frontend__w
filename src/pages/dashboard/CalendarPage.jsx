import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarDays, Plus } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ErrorState from "../../components/workspace/common/ErrorState";
import EmptyState from "../../components/workspace/common/EmptyState";
import { SkeletonCard } from "../../components/workspace/common/Skeleton";

import CalendarToolbar   from "../../components/hrms/calendar/CalendarToolbar";
import MonthView         from "../../components/hrms/calendar/MonthView";
import WeekView          from "../../components/hrms/calendar/WeekView";
import DayView           from "../../components/hrms/calendar/DayView";
import EventFormModal    from "../../components/hrms/calendar/EventFormModal";
import EventDetailsModal from "../../components/hrms/calendar/EventDetailsModal";

import {
  listEvents,
  getEvent,
  listHolidays,
  listLeaves,
  listBirthdays,
} from "../../services/hrmsCalendarService";

import {
  normalizeEvent,
  normalizeHoliday,
  normalizeLeave,
  normalizeBirthday,
  sortFeed,
} from "../../utils/hrmsCalendarFeed";

import {
  scopesForRole,
  eventTypeMeta,
  EVENT_TYPES,
} from "../../utils/hrmsCalendarConstants";

import {
  dateKey,
  startOfMonth, endOfMonth,
  startOfWeek,  endOfWeek,
  startOfDay,   endOfDay,
  addDays,      addMonths,
  monthsInRange,
} from "../../utils/calendarDateUtils";

import { formatDateTime as formatDateTimeUtil } from "../../utils/date";

const LEGEND_TYPES = EVENT_TYPES.filter((t) => t !== "ATTENDANCE");

export default function CalendarPage({ embedded = false }) {
  const { role, user } = useAuth();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  const today = useMemo(() => new Date(), []);

  const [viewMode, setViewMode] = useState("month");

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [selectedDay, setSelectedDay] = useState(today);

  const availableScopes = useMemo(() => scopesForRole(role), [role]);

  const [scope, setScope] = useState(
    availableScopes.includes("team") ? "team" : "mine"
  );

  const [eventType, setEventType] = useState("");

  const [events,          setEvents]          = useState([]);
  const [holidays,        setHolidays]        = useState([]);
  const [leaves,          setLeaves]          = useState([]);
  const [birthdaysByMonth, setBirthdaysByMonth] = useState({});

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [formModal,    setFormModal]    = useState(null);
  const [detailsItem,  setDetailsItem]  = useState(null);

  const range = useMemo(() => {
    if (viewMode === "month")
      return { start: startOfMonth(viewDate), end: endOfMonth(viewDate) };
    if (viewMode === "week")
      return { start: startOfWeek(viewDate),  end: endOfWeek(viewDate)  };
    return { start: startOfDay(viewDate), end: endOfDay(viewDate) };
  }, [viewMode, viewDate]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    const fromISO      = range.start.toISOString();
    const toISO        = range.end.toISOString();
    const monthsNeeded = monthsInRange(range.start, range.end);

    Promise.all([
      listEvents({
        from:      fromISO,
        to:        toISO,
        eventType: eventType || undefined,
        scope,
      }),
      listHolidays({ year: range.start.getFullYear() }),
      listLeaves({ from: dateKey(range.start), to: dateKey(range.end) }),
      Promise.all(
        monthsNeeded.map(({ month }) =>
          listBirthdays({ month }).then((list) => ({ month, list }))
        )
      ),
    ])
      .then(([evRes, holRes, leaveRes, birthdayResArr]) => {
        setEvents(evRes);
        setHolidays(holRes);
        setLeaves(leaveRes);
        const map = {};
        birthdayResArr.forEach(({ month, list }) => { map[month] = list; });
        setBirthdaysByMonth(map);
      })
      .catch(() => setError("Couldn't load the calendar. Please try again."))
      .finally(() => setLoading(false));
  }, [range, eventType, scope]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const eventId = params.get("event");
    if (!eventId) return;

    getEvent(eventId)
      .then((ev) => {
        const start = new Date(ev.startsAt);
        setViewDate(new Date(start.getFullYear(), start.getMonth(), start.getDate()));
        setSelectedDay(start);
        setDetailsItem(normalizeEvent(ev));
      })
      .catch(() => toast.error("Couldn't open that event"));
  }, [params]);

  const unifiedItems = useMemo(() => {
    const items = [];

    events.forEach((ev) => items.push(normalizeEvent(ev)));

    holidays.forEach((h) => {
      const d = new Date(`${h.date}T00:00:00`);
      if (d >= range.start && d <= range.end) items.push(normalizeHoliday(h));
    });

    leaves.forEach((l) => {
      const from = new Date(`${l.fromDate}T00:00:00`);
      const to   = new Date(`${l.toDate}T23:59:59`);
      if (to >= range.start && from <= range.end) items.push(normalizeLeave(l));
    });

    monthsInRange(range.start, range.end).forEach(({ year, month }) => {
      (birthdaysByMonth[month] || []).forEach((b) => {
        const norm = normalizeBirthday(b, year, month);
        const d    = new Date(norm.startsAt);
        if (d >= range.start && d <= range.end) items.push(norm);
      });
    });

    return sortFeed(items);
  }, [events, holidays, leaves, birthdaysByMonth, range]);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    unifiedItems.forEach((it) => {
      let cursor = startOfDay(new Date(it.startsAt));
      const last = startOfDay(new Date(it.endsAt));
      let guard  = 0;
      while (cursor <= last && guard < 62) {
        const key = dateKey(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(it);
        cursor = addDays(cursor, 1);
        guard += 1;
      }
    });
    return map;
  }, [unifiedItems]);

  const selectedDayItems = itemsByDay.get(dateKey(selectedDay)) || [];
  const dayViewItems     = itemsByDay.get(dateKey(viewDate))    || [];

  function goPrev() {
    if (viewMode === "month") setViewDate((d) => addMonths(d, -1));
    else if (viewMode === "week") setViewDate((d) => addDays(d, -7));
    else setViewDate((d) => addDays(d, -1));
  }

  function goNext() {
    if (viewMode === "month") setViewDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setViewDate((d) => addDays(d, 7));
    else setViewDate((d) => addDays(d, 1));
  }

  function goToday() {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setViewDate(t);
    setSelectedDay(today);
  }

  function openItem(item) {
    setDetailsItem(item);
  }

  function handleSlotCreate(day) {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    setFormModal({ initialStart: start, initialEnd: end });
  }

  function handleNewEvent() {
    const base = viewMode === "day" ? viewDate : selectedDay;
    handleSlotCreate(base);
  }

  function handleEdit(rawEvent) {
    setDetailsItem(null);
    setFormModal({ event: rawEvent });
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-canvas"}>

      {!embedded && <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="container-page flex items-center gap-3 h-16">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-primary-50 text-muted"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <CalendarDays size={19} className="text-primary-500" />
            HRMS Calendar
          </h1>
          <span className="text-xs text-faint ml-1 hidden sm:inline">
            Signed in as {user?.name} ({role})
          </span>
        </div>
      </header>}

      <main className={embedded ? "space-y-4" : "container-page py-6 space-y-4"}>

        <CalendarToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          viewDate={viewDate}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          loading={loading}
          onRefresh={load}
          scope={scope}
          onScopeChange={setScope}
          availableScopes={availableScopes}
          eventType={eventType}
          onEventTypeChange={setEventType}
          onNewEvent={handleNewEvent}
        />

        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND_TYPES.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: eventTypeMeta(t).color }}
              />
              {eventTypeMeta(t).label}
            </span>
          ))}
        </div>

        {error && <ErrorState description={error} onRetry={load} />}

        {!error && loading && (
          <div className="card">
            <SkeletonCard />
          </div>
        )}

        {!error && !loading && (
          <div
            className={
              viewMode === "day"
                ? ""
                : "grid lg:grid-cols-[1fr_320px] gap-5 items-start"
            }
          >
            <div>
              {viewMode === "month" && (
                <MonthView
                  viewDate={viewDate}
                  today={today}
                  itemsByDay={itemsByDay}
                  onSelectDay={setSelectedDay}
                  onOpenItem={openItem}
                  onSlotCreate={handleSlotCreate}
                />
              )}
              {viewMode === "week" && (
                <WeekView
                  viewDate={viewDate}
                  today={today}
                  itemsByDay={itemsByDay}
                  onOpenItem={openItem}
                  onSlotCreate={handleSlotCreate}
                />
              )}
              {viewMode === "day" && (
                <DayView
                  viewDate={viewDate}
                  items={dayViewItems}
                  onOpenItem={openItem}
                  onSlotCreate={handleSlotCreate}
                />
              )}
            </div>

            {viewMode !== "day" && (
              <div className="card card-pad">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-bold text-ink text-sm">
                    {selectedDay.toLocaleDateString(undefined, {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </p>
                  <button
                    onClick={() => handleSlotCreate(selectedDay)}
                    className="btn-outline btn-sm"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>

                {selectedDayItems.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Nothing scheduled"
                    description="No events, leave, holidays or birthdays on this day."
                  />
                ) : (
                  <ul className="space-y-2">
                    {selectedDayItems.map((it) => (
                      <li
                        key={it.id}
                        className="rounded-xl border border-line overflow-hidden cursor-pointer
                          hover:border-primary-200 transition-colors"
                        onClick={() => openItem(it)}
                      >
                        <div className="h-1" style={{ backgroundColor: it.color }} />
                        <div className="p-3">
                          <p className="text-sm font-semibold text-ink truncate">{it.title}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {it.allDay
                              ? "All day"
                              : `${formatDateTimeUtil(it.startsAt)} – ${formatDateTimeUtil(it.endsAt)}`}
                          </p>
                          {it.kind === "EVENT" && it.raw.location && (
                            <p className="text-xs text-faint mt-0.5 truncate">{it.raw.location}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {formModal !== null && (
        <EventFormModal
          event={formModal.event}
          initialStart={formModal.initialStart}
          initialEnd={formModal.initialEnd}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); load(); }}
        />
      )}

      {detailsItem && (
        <EventDetailsModal
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onEdit={handleEdit}
          onChanged={load}
        />
      )}
    </div>
  );
}