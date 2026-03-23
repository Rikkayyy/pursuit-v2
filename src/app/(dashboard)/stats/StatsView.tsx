"use client";

import { useState } from "react";
import type { DailyStat } from "@/lib/stats";

type Props = {
  stats: DailyStat[];
  today: string;
};

function getCellColor(rate: number, hasData: boolean): string {
  if (!hasData || rate === 0) return "#e5e7eb";
  if (rate <= 25) return "#ffd6e3";
  if (rate <= 50) return "#ff99bb";
  if (rate <= 75) return "#ff4d88";
  return "#ff0055";
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatMonthShort(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

// ─── Monthly View ─────────────────────────────────────────────────────────────

function MonthlyView({
  stats,
  selectedMonth,
  today,
  onPrev,
  onNext,
  canGoNext,
  canGoPrev,
}: {
  stats: DailyStat[];
  selectedMonth: string;
  today: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}) {
  const monthStats = stats.filter((s) => s.date.startsWith(selectedMonth));
  const todayMonth = today.substring(0, 7);
  const isCurrentMonth = selectedMonth === todayMonth;

  // Fill in all days of the month (including future days with no data)
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDays: Array<DailyStat & { isFuture: boolean }> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
    const stat = monthStats.find((s) => s.date === dateStr);
    allDays.push({
      date: dateStr,
      completed: stat?.completed ?? 0,
      expected: stat?.expected ?? 0,
      rate: stat?.rate ?? 0,
      isFuture: dateStr > today,
    });
  }

  const validRates = allDays.filter((d) => !d.isFuture && d.expected > 0).map((d) => d.rate);
  const avgRate =
    validRates.length > 0
      ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
      : 0;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {formatMonthLabel(selectedMonth)}
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-[2px] h-32 px-1">
        {allDays.map((day) => {
          const isToday = day.date === today;
          const dayNum = Number(day.date.split("-")[2]);

          let barColor = "#e5e7eb"; // gray for future/no-data
          if (!day.isFuture) {
            if (day.expected === 0) {
              barColor = "#e5e7eb";
            } else {
              barColor = "#ff0055";
            }
          }

          const barHeight =
            day.isFuture || day.expected === 0
              ? 4
              : Math.max(day.rate, 4);

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-[2px]"
              title={
                day.isFuture
                  ? day.date
                  : `${day.date}: ${day.rate}% (${day.completed}/${day.expected})`
              }
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: barColor,
                    opacity: day.isFuture || day.expected === 0 ? 0.4 : 1,
                  }}
                />
              </div>
              {/* Day label — show 1, 5, 10, 15, 20, 25 */}
              <span
                className="text-gray-400 leading-none"
                style={{ fontSize: "9px" }}
              >
                {[1, 5, 10, 15, 20, 25].includes(dayNum) ? dayNum : ""}
              </span>
              {isToday && (
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "#ff0055" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {isCurrentMonth ? "This month" : formatMonthLabel(selectedMonth)}
        </span>
        <span className="font-semibold" style={{ color: avgRate > 0 ? "#ff0055" : "#9ca3af" }}>
          {avgRate > 0 ? `${avgRate}% avg` : "No data"}
        </span>
      </div>
    </div>
  );
}

// ─── Contribution Grid ────────────────────────────────────────────────────────

function ContributionGrid({
  stats,
  today,
}: {
  stats: DailyStat[];
  today: string;
}) {
  // Build a map for quick lookup
  const statMap = new Map(stats.map((s) => [s.date, s]));

  // Determine grid start: go back to the Sunday before the earliest date
  const earliestDate = stats[0]?.date ?? today;
  const startDay = new Date(earliestDate + "T12:00:00");
  // Roll back to nearest Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const endDay = new Date(today + "T12:00:00");

  // Build weeks
  const weeks: Array<Array<string | null>> = [];
  const current = new Date(startDay);

  while (current <= endDay) {
    const week: Array<string | null> = [];
    for (let d = 0; d < 7; d++) {
      if (current <= endDay) {
        week.push(current.toLocaleDateString("en-CA"));
        current.setDate(current.getDate() + 1);
      } else {
        week.push(null);
      }
    }
    weeks.push(week);
  }

  // Build month labels (show at first week of each month)
  const monthLabels: Array<{ weekIndex: number; label: string }> = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const firstDate = week.find((d) => d !== null);
    if (firstDate) {
      const m = firstDate.substring(0, 7);
      if (m !== lastMonth) {
        monthLabels.push({ weekIndex: wi, label: formatMonthShort(m) });
        lastMonth = m;
      }
    }
  });

  const CELL = 11; // px
  const GAP = 3;

  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ minWidth: weeks.length * (CELL + GAP) }}>
        {/* Month labels row */}
        <div className="flex mb-1" style={{ gap: GAP }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.weekIndex === wi);
            return (
              <div
                key={wi}
                className="text-gray-400 leading-none"
                style={{ width: CELL, flexShrink: 0, fontSize: "9px" }}
              >
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>

        {/* Grid: 7 rows × N weeks */}
        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((date, di) => {
                if (!date) {
                  return (
                    <div
                      key={di}
                      style={{ width: CELL, height: CELL, flexShrink: 0 }}
                    />
                  );
                }
                const stat = statMap.get(date);
                const hasData = !!stat && stat.expected > 0;
                const rate = stat?.rate ?? 0;
                const color = getCellColor(rate, hasData);
                const isFuture = date > today;

                return (
                  <div
                    key={di}
                    title={
                      isFuture
                        ? date
                        : hasData
                        ? `${date}: ${rate}%`
                        : `${date}: no tasks`
                    }
                    style={{
                      width: CELL,
                      height: CELL,
                      flexShrink: 0,
                      backgroundColor: isFuture ? "transparent" : color,
                      borderRadius: 2,
                      opacity: isFuture ? 0 : 1,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-gray-400" style={{ fontSize: "9px" }}>Less</span>
          {["#e5e7eb", "#ffd6e3", "#ff99bb", "#ff4d88", "#ff0055"].map((c) => (
            <div
              key={c}
              style={{
                width: CELL,
                height: CELL,
                backgroundColor: c,
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
          ))}
          <span className="text-gray-400" style={{ fontSize: "9px" }}>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main StatsView ───────────────────────────────────────────────────────────

export default function StatsView({ stats, today }: Props) {
  const currentMonth = today.substring(0, 7);
  const [view, setView] = useState<"monthly" | "grid">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Earliest month we have data for (or 13 months ago)
  const earliestMonth =
    stats.length > 0 ? stats[0].date.substring(0, 7) : currentMonth;

  function prevMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(d.toLocaleDateString("en-CA").substring(0, 7));
  }

  function nextMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(d.toLocaleDateString("en-CA").substring(0, 7));
  }

  const canGoNext = selectedMonth < currentMonth;
  const canGoPrev = selectedMonth > earliestMonth;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Stats</h1>

      {/* View switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setView("monthly")}
          className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={
            view === "monthly"
              ? { backgroundColor: "#ff0055", color: "#ffffff" }
              : { backgroundColor: "transparent", color: "#6b7280" }
          }
        >
          Monthly
        </button>
        <button
          onClick={() => setView("grid")}
          className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={
            view === "grid"
              ? { backgroundColor: "#ff0055", color: "#ffffff" }
              : { backgroundColor: "transparent", color: "#6b7280" }
          }
        >
          Grid
        </button>
      </div>

      {/* Chart area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        {view === "monthly" ? (
          <MonthlyView
            stats={stats}
            selectedMonth={selectedMonth}
            today={today}
            onPrev={prevMonth}
            onNext={nextMonth}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
          />
        ) : (
          <ContributionGrid stats={stats} today={today} />
        )}
      </div>
    </div>
  );
}
