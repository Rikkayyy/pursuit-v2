"use client";

import TaskItem, { type DailyTask } from "@/components/features/daily/TaskItem";
import WeeklyTaskItem from "@/components/features/daily/WeeklyTaskItem";
import AnytimeTask, { type AnytimeItem } from "@/components/features/daily/AnytimeTask";
import TaskSection from "@/components/features/daily/TaskSection";

// One goal's tasks on the daily view, split into its three sections.
export type GoalGroup = {
  goalId: string;
  goalTitle: string;
  goalColor: string;
  today: DailyTask[]; // daily + one-time due today
  thisWeek: DailyTask[]; // weekly: flexible + specific days
  anytime: AnytimeItem[]; // one-time, no date
};

function getConsistencyLabel(rate: number): {
  text: string;
  color: string;
  bg: string;
} {
  if (rate >= 90)
    return {
      text: "Consistency: High",
      color: "var(--chart-4)",
      bg: "color-mix(in srgb, var(--chart-4) 10%, transparent)",
    };
  if (rate >= 70)
    return {
      text: `${rate}% This Week`,
      color: "var(--chart-2)",
      bg: "color-mix(in srgb, var(--chart-2) 10%, transparent)",
    };
  if (rate >= 40)
    return {
      text: `${rate}% This Week`,
      color: "var(--chart-1)",
      bg: "color-mix(in srgb, var(--chart-1) 10%, transparent)",
    };
  if (rate > 0)
    return {
      text: `${rate}% This Week`,
      color: "var(--destructive)",
      bg: "color-mix(in srgb, var(--destructive) 10%, transparent)",
    };
  return {
    text: "Not Started",
    color: "var(--muted-foreground)",
    bg: "var(--secondary)",
  };
}

export default function GoalSection({
  group,
  weeklyRate,
  today,
  onTaskToggle,
}: {
  group: GoalGroup;
  weeklyRate?: number; // this week's hit rate, when the goal has one
  today: string; // the selected date
  onTaskToggle?: (taskId: string, newState: boolean) => void;
}) {
  const label = weeklyRate !== undefined ? getConsistencyLabel(weeklyRate) : null;
  const sectionCount =
    Number(group.today.length > 0) +
    Number(group.thisWeek.length > 0) +
    Number(group.anytime.length > 0);
  const showLabels = sectionCount > 1; // only label sections on goals with more than one

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: group.goalColor,
              boxShadow: `0 0 8px ${group.goalColor}66`,
            }}
          />
          <h3 className="font-heading font-bold text-lg text-foreground">{group.goalTitle}</h3>
        </div>
        {label && (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
            style={{ color: label.color, backgroundColor: label.bg }}
          >
            {label.text}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <TaskSection show={group.today.length > 0} label={showLabels ? "Daily" : undefined}>
          {group.today.map((item) => (
            <TaskItem key={item.task.id} item={item} today={today} onToggle={onTaskToggle} />
          ))}
        </TaskSection>

        <TaskSection show={group.thisWeek.length > 0} label={showLabels ? "Weekly" : undefined}>
          {group.thisWeek.map((item) => (
            <WeeklyTaskItem key={item.task.id} item={item} today={today} onToggle={onTaskToggle} />
          ))}
        </TaskSection>

        <TaskSection show={group.anytime.length > 0} label="Anytime">
          {group.anytime.map((item) => (
            <AnytimeTask key={item.task.id} item={item} today={today} onToggle={onTaskToggle} />
          ))}
        </TaskSection>
      </div>
    </section>
  );
}
