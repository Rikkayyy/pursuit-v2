"use client";

import { Icon } from "@iconify/react";
import { useTaskToggle } from "@/hooks/useTaskToggle";
import type { DailyTask } from "./TaskItem";
import { weeklyTarget, countsTowardWeek, getWeekDates } from "@/lib/weekly";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Hardcoded hex values (not CSS vars) so the dots and segments never blend into the card.
const GRAY_DOT = "#d1d5db";
const FAINT_DOT = "#e5e7eb";
const DONE_GREEN = { bg: "#ecfccb", text: "#65a30d" };
const STREAK_ORANGE = { bg: "#fff7ed", text: "#f97316" };


// Card for a flexible task ("N times anytime this week") and specific days task (selected days during the week).
export default function WeeklyTaskItem({
  item,
  today,
  onToggle,
}: {
  item: DailyTask;
  today: string; // the selected date
  onToggle?: (taskId: string, newState: boolean) => void;
}) {
  const { isCompleted, isPending, toggle } = useTaskToggle(
    item.task.id,
    item.isCompleted,
    today,
    onToggle
  );

  const color = item.goalColor;
  const isSpecificFrequency = item.task.frequency === "specific_days";
  const scheduled = new Set(item.task.scheduled_days ?? []);
  const target = weeklyTarget(item.task);
  const selectedDayOfWeek = new Date(today + "T12:00:00").getDay();

  // Server dates, adjusted for an unsaved toggle of the selected day.
  const logged = new Set(item.weekDates);
  if (isCompleted) logged.add(today);
  else logged.delete(today);

  // Specific days: only logs on scheduled days count.
  const count = [...logged].filter((d) => countsTowardWeek(item.task, d)).length;
  const isWeekDone = count >= target;
  const weekDates = getWeekDates(today);

  const canLogToday = !isSpecificFrequency || scheduled.has(selectedDayOfWeek);
  const nextDayOfWeek = [...scheduled].sort((a, b) => a - b).find((d) => d > selectedDayOfWeek);
  const nextLabel = nextDayOfWeek !== undefined ? `Next: ${FULL_DAY_NAMES[nextDayOfWeek]}` : "Next week";


  return (
    <div className="bg-card rounded-2xl p-4 relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          backgroundColor: `${color}40`, // faint base line (~15% opacity)
          backgroundImage: `repeating-linear-gradient(to bottom, ${color}b3 0 6px, transparent 6px 11px)`, // dashes (~70%)
        }}
      />

      {/* Header: icon, title, log button */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon icon={isSpecificFrequency ? "solar:calendar-mark-linear" : "solar:refresh-linear"} className="text-base" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base leading-tight text-foreground">
            {item.task.title}
          </h4>
         <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
            {isSpecificFrequency && canLogToday && !isCompleted && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                Due today
              </span>
            )}
            {item.streak > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: STREAK_ORANGE.bg, color: STREAK_ORANGE.text }}
              >
                <Icon icon="solar:fire-bold" className="text-xs" />
                {item.streak} week streak
              </span>
            )}
          </div>
        </div>

        {!canLogToday ? (
          <span className="h-9 px-3 rounded-full bg-secondary text-muted-foreground text-xs font-bold flex items-center flex-shrink-0">
            {nextLabel}
          </span>
        ) : isCompleted ? (
              <button
                onClick={toggle}
                disabled={isPending}
                aria-label="Undo today's log"
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground active:scale-90 transition-transform tap flex-shrink-0"
              >
                <Icon icon="solar:undo-left-round-linear" className="text-base" />
              </button>
        ) : (
              <button
                onClick={toggle}
                disabled={isPending}
                className="h-9 px-4 rounded-full text-white text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform tap flex-shrink-0 disabled:opacity-60"
                style={{ backgroundColor: color, boxShadow: `0 4px 12px ${color}55` }}
              >
                <Icon icon="hugeicons:add-01" className="text-sm" />
                Log
              </button>
        )}
      </div>

      {/* Progress: one segment per required day */}
      <div className="flex items-center gap-2 mt-2 ml-11">
        <div className="flex items-center gap-1">
          {Array.from({ length: target }, (_, i) => (
            <span
              key={i}
              className="w-5 h-2.5 rounded-full transition-colors"
              style={{ backgroundColor: i < count ? color : FAINT_DOT }}
            />
          ))}
        </div>
        <span
          className={`text-xs font-bold ${isWeekDone ? "" : "text-muted-foreground"}`}
          style={{ color: isWeekDone ? color : undefined }}
        >
          {Math.min(count, target)}/{target}×
        </span>
        {isWeekDone && (
          <span
            className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: DONE_GREEN.bg, color: DONE_GREEN.text }}
          >
            <Icon icon="solar:check-read-linear" className="text-xs" />
            Done
          </span>
        )}
      </div>

      {/* Week strip: which days were logged */}
      <div className="grid grid-cols-7 mt-4">
        {weekDates.map((date, i) => {
          const isLogged =  logged.has(date) && countsTowardWeek(item.task, date);
          const isSelected = date === today;
          const isFuture = date > today;
          const isOffDay = isSpecificFrequency && !scheduled.has(i);
          const isMissed = isSpecificFrequency && !isOffDay && !isLogged && date < today;

          return (
            <div key={date} className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isLogged || isSelected ? `${color}1f` : isMissed ? "#f3f4f6" : "transparent",
                  boxShadow: isSelected
                    ? `inset 0 0 0 1.5px ${color}`
                    : isSpecificFrequency && !isOffDay && !isLogged
                      ? `inset 0 0 0 1px ${GRAY_DOT}`
                      : undefined,
                }}
              >
                {!isOffDay && (
                  <span
                    className={isLogged ? "w-2 h-2 rounded-full" : "w-1.5 h-1.5 rounded-full"}
                    style={{ backgroundColor: isLogged ? color : isFuture ? FAINT_DOT : GRAY_DOT }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-bold"
                style={{
                  color: isLogged ? color : isOffDay || isFuture ? GRAY_DOT : "#6b7280",
                }}
              >
                {WEEKDAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
