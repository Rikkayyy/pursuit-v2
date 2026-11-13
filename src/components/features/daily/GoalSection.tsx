"use client";

import TaskItem, { type DailyTask } from "./TaskItem";
import WeeklyTaskItem from "./WeeklyTaskItem";
import AnytimeTask, { type AnytimeItem } from "./AnytimeTask";
import TaskSection from "./TaskSection";
import GoalHeader from "./GoalHeader";

// One goal's tasks on the daily view, split into its three sections.
export type GoalGroup = {
  goalId: string;
  goalTitle: string;
  goalColor: string;
  today: DailyTask[]; // daily + one-time due today
  thisWeek: DailyTask[]; // weekly: flexible + specific days
  anytime: AnytimeItem[]; // one-time, no date
};

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
  const sectionCount =
    Number(group.today.length > 0) +
    Number(group.thisWeek.length > 0) +
    Number(group.anytime.length > 0);
  const showLabels = sectionCount > 1; // only label sections on goals with more than one

  return (
    <section>
      <GoalHeader title={group.goalTitle} color={group.goalColor} weeklyRate={weeklyRate} />

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
