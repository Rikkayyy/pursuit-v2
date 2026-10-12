"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";
import { getOverallStreaks } from "@/lib/streaks";

type TaskForStats = {
  id: string;
  type: string;
  frequency: string | null;
  scheduled_days: number[] | null;
  due_date: string | null;
};

type DayData = {
  completed: number;
  expected: number;
};

type DayState = "none" | "missed" | "partial" | "full";

// Hardcoded hex values (not CSS vars) so the states never blend into the card background.
const COLORS = {
  primary: "#ff0055",
  fullBg: "#ffd1de",
  fullText: "#ff0055",
  band: "#ffe4ec",
  partialBg: "#ffedd5",
  partialText: "#f97316",
  missedBg: "#f3f4f6",
  mutedText: "#9ca3af",
  faintText: "#d1d5db",
};

const LEGEND = [
  { label: "Completed", bg: COLORS.fullBg, border: "#ffb3c8" },
  { label: "Partial", bg: COLORS.partialBg, border: "#fed7aa" },
  { label: "Missed", bg: COLORS.missedBg, border: "#e5e7eb" },
];

const DAY_LABELS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function dateToStr(d: Date) {
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

function isTaskDueOn(task: TaskForStats, dateStr: string): boolean {
  if (task.type === "recurring") {
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    if (task.frequency === "daily") return true;
    if (task.frequency === "specific_days") return task.scheduled_days?.includes(dayOfWeek) ?? false;
    return false;
  }
  return task.due_date === dateStr;
}

function getDayState(info: DayData | undefined): DayState {
  if (!info || info.expected === 0) return "none";
  if (info.completed === 0) return "missed";
  if (info.completed >= info.expected) return "full";
  return "partial";
}

// Every date shown in the month grid, including leading/trailing days from adjacent months.
function getGridDates(year: number, month: number) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, i) => {
    const d = new Date(year, month, 1 - firstDayOfWeek + i, 12);
    return { dateStr: dateToStr(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

export default function CalendarModal({
  open,
  onClose,
  selectedDate,
  today,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  today: string;
}) {
  const router = useRouter();
  const [viewYear, setViewYear] = useState(() => Number(selectedDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(selectedDate.slice(5, 7)) - 1);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [streaks, setStreaks] = useState<{ current: number; longest: number } | null>(null);

  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7)) - 1;
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  useEffect(() => {
    if (!open) return;
    setViewYear(Number(selectedDate.slice(0, 4)));
    setViewMonth(Number(selectedDate.slice(5, 7)) - 1);
  }, [open, selectedDate]);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const gridDates = getGridDates(viewYear, viewMonth).map((d) => d.dateStr);
    const startStr = gridDates[0];
    const endStr = gridDates[gridDates.length - 1];

    const [{ data: goals }, { data: logs }] = await Promise.all([
      supabase
        .from("goals")
        .select("tasks (id, type, frequency, scheduled_days, due_date)")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("task_logs")
        .select("task_id, date")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .lte("date", endStr),
    ]);

    const tasks: TaskForStats[] = (goals || []).flatMap((g) => g.tasks || []);

    const result: Record<string, DayData> = {};
    for (const dateStr of gridDates) {
      const dueIds = new Set(tasks.filter((t) => isTaskDueOn(t, dateStr)).map((t) => t.id));
      // Only count logs for tasks due that day, so stray logs (e.g. a one-time task
      // completed on a different date) can't push a day over its expected count.
      const completed = (logs || []).filter((l) => l.date === dateStr && dueIds.has(l.task_id)).length;
      result[dateStr] = { completed, expected: dueIds.size };
    }

    setDays(result);
    setLoading(false);
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (open) loadMonth();
  }, [open, loadMonth]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await getOverallStreaks(supabase, user.id, timezone);
      setStreaks(result);
    })();
  }, [open]);

  if (!open) return null;

  const selectedDateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const gridDates = getGridDates(viewYear, viewMonth);
  const weeks = Array.from({ length: gridDates.length / 7 }, (_, i) => gridDates.slice(i * 7, i * 7 + 7));

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (dateStr: string) => {
    if (dateStr > today) return;
    if (dateStr !== selectedDate) router.push(`/?date=${dateStr}`);
    onClose();
  };

  // Matches getOverallStreaks: any completion keeps the streak alive, so partial days count.
  const isStreakDay = (dateStr: string) => {
    if (loading || dateStr > today) return false;
    const state = getDayState(days[dateStr]);
    return state === "full" || state === "partial";
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2rem] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#fff0f4] to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] block mb-1">
                Select a Date
              </span>
              <h2 className="text-2xl font-heading font-extrabold text-foreground tracking-tight">
                {selectedDateLabel}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {streaks && streaks.current > 0 && (
                <span
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: COLORS.fullBg, color: COLORS.primary }}
                >
                  <Icon icon="solar:fire-bold" className="text-sm" />
                  {streaks.current}
                </span>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform tap"
              >
                <Icon icon="solar:close-linear" className="text-base" />
              </button>
            </div>
          </div>

          {/* Streak stats */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2.5 bg-secondary rounded-2xl px-3.5 py-3">
              <Icon icon="solar:fire-linear" className="text-lg flex-shrink-0" style={{ color: COLORS.primary }} />
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Current
                </span>
                <span className="text-sm font-heading font-bold text-foreground">
                  {streaks ? `${streaks.current} day${streaks.current === 1 ? "" : "s"}` : "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-secondary rounded-2xl px-3.5 py-3">
              <Icon icon="solar:bolt-linear" className="text-lg flex-shrink-0" style={{ color: COLORS.partialText }} />
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Best
                </span>
                <span className="text-sm font-heading font-bold text-foreground">
                  {streaks ? `${streaks.longest} day${streaks.longest === 1 ? "" : "s"}` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={goToPrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform tap"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="text-base" />
            </button>
            <h3 className="text-sm font-heading font-bold text-foreground">{monthLabel}</h3>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next month"
              className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform tap ${
                isCurrentMonth ? "text-muted-foreground/30 cursor-not-allowed" : "text-foreground"
              }`}
            >
              <Icon icon="solar:alt-arrow-right-linear" className="text-base" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-muted-foreground uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className={loading ? "animate-pulse" : ""}>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map(({ dateStr, day, inMonth }, di) => {
                  const isFuture = dateStr > today;
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === today;
                  const state: DayState = loading || isFuture ? "none" : getDayState(days[dateStr]);

                  // Connect consecutive streak days (full or partial) in the same week with a band.
                  const onStreak = isStreakDay(dateStr);
                  const connectLeft = onStreak && di > 0 && isStreakDay(week[di - 1].dateStr);
                  const connectRight = onStreak && di < 6 && isStreakDay(week[di + 1].dateStr);

                  let bg = "transparent";
                  let color = inMonth ? COLORS.mutedText : COLORS.faintText;
                  if (isSelected) {
                    bg = COLORS.primary;
                    color = "#ffffff";
                  } else if (isFuture) {
                    color = COLORS.faintText;
                  } else if (state === "full") {
                    bg = COLORS.fullBg;
                    color = COLORS.fullText;
                  } else if (state === "partial") {
                    bg = COLORS.partialBg;
                    color = COLORS.partialText;
                  } else if (state === "missed") {
                    bg = COLORS.missedBg;
                  }

                  return (
                    <div key={dateStr} className="relative flex items-center justify-center py-1">
                      {(connectLeft || connectRight) && (
                        <div
                          className="absolute top-1 bottom-1"
                          style={{
                            backgroundColor: COLORS.band,
                            left: connectLeft ? 0 : "50%",
                            right: connectRight ? 0 : "50%",
                          }}
                        />
                      )}
                      <button
                        onClick={() => selectDay(dateStr)}
                        disabled={isFuture}
                        className={`relative w-10 h-10 rounded-full flex flex-col items-center justify-center text-sm font-heading font-bold transition-transform ${
                          isFuture ? "cursor-not-allowed" : "active:scale-90 tap"
                        } ${isSelected ? "shadow-[0_4px_12px_rgba(255,0,85,0.4)]" : ""}`}
                        style={{
                          backgroundColor: bg,
                          color,
                          opacity: !inMonth && !isSelected ? 0.5 : 1,
                        }}
                      >
                        {day}
                        {isToday && !isSelected && (
                          <span
                            className="absolute bottom-1 w-1 h-1 rounded-full"
                            style={{ backgroundColor: COLORS.primary }}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pb-5">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}
                />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
