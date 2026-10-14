"use client";

import { getDayState, getGridDates, isStreakState, type DayData } from "@/lib/calendar";
import CalendarDay from "./CalendarDay";
import { CALENDAR_COLORS as COLORS } from "./colors";

const DAY_LABELS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const LEGEND = [
  { label: "Completed", bg: COLORS.fullBg, border: "#ffb3c8" },
  { label: "Partial", bg: COLORS.partialBg, border: "#fed7aa" },
  { label: "Missed", bg: COLORS.missedBg, border: "#e5e7eb" },
];

export default function CalendarGrid({
  viewYear,
  viewMonth,
  days,
  loading,
  selectedDate,
  today,
  onSelect,
}: {
  viewYear: number;
  viewMonth: number;
  days: Record<string, DayData>;
  loading: boolean;
  selectedDate: string;
  today: string;
  onSelect: (dateStr: string) => void;
}) {
  const gridDates = getGridDates(viewYear, viewMonth);
  const weeks = Array.from({ length: gridDates.length / 7 }, (_, i) => gridDates.slice(i * 7, i * 7 + 7));

  const stateOf = (dateStr: string) =>
    loading || dateStr > today ? "none" : getDayState(days[dateStr]);

  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className={loading ? "animate-pulse" : ""}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(({ dateStr, day, inMonth }, di) => {
              const state = stateOf(dateStr);
              // Connect consecutive streak days (full or partial) in the same week with a band.
              const onStreak = isStreakState(state);
              const connectLeft = onStreak && di > 0 && isStreakState(stateOf(week[di - 1].dateStr));
              const connectRight = onStreak && di < 6 && isStreakState(stateOf(week[di + 1].dateStr));

              return (
                <CalendarDay
                  key={dateStr}
                  day={day}
                  state={state}
                  inMonth={inMonth}
                  isSelected={dateStr === selectedDate}
                  isToday={dateStr === today}
                  isFuture={dateStr > today}
                  connectLeft={connectLeft}
                  connectRight={connectRight}
                  onSelect={() => onSelect(dateStr)}
                />
              );
            })}
          </div>
        ))}
      </div>

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
    </>
  );
}
