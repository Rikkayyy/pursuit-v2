"use client";

import type { DailyTask } from "@/components/features/daily/TaskItem";
import type { AnytimeItem } from "@/components/features/daily/AnytimeTask";
import GoalSection, { type GoalGroup } from "@/components/features/daily/GoalSection";
import { isWeeklyTask, weeklyTarget, countsTowardWeek } from "@/lib/weekly";

// Groups the day's tasks by goal, then renders one GoalSection per goal.
export default function DailyTaskList({
  tasks,
  anytimeTasks,
  today,
  goalStats,
  onTaskToggle,
}: {
  tasks: DailyTask[];
  anytimeTasks: AnytimeItem[];
  today: string;
  goalStats: Record<string, { rate: number }>;
  onTaskToggle?: (taskId: string, newState: boolean) => void;
}) {
  const groups: Record<string, GoalGroup> = {};
  const groupFor = (item: {
    task: { goal_id: string };
    goalTitle: string;
    goalColor: string;
  }) =>
    (groups[item.task.goal_id] ??= {
      goalId: item.task.goal_id,
      goalTitle: item.goalTitle,
      goalColor: item.goalColor,
      today: [],
      thisWeek: [],
      anytime: [],
    });

  for (const t of tasks) {
    if (isWeeklyTask(t.task)) groupFor(t).thisWeek.push(t);
    else groupFor(t).today.push(t);
  }
  for (const t of anytimeTasks) groupFor(t).anytime.push(t);

  // Weekly tasks that already met their target go last.
  const isWeekDone = (t: DailyTask) =>
    t.weekDates.filter((d) => countsTowardWeek(t.task, d)).length >= weeklyTarget(t.task);
  for (const g of Object.values(groups)) {
    g.thisWeek.sort((a, b) => Number(isWeekDone(a)) - Number(isWeekDone(b)));
  }

  // Goals with something due today come first.
  const orderedGroups = Object.values(groups).sort(
    (a, b) => Number(b.today.length > 0) - Number(a.today.length > 0)
  );

  return (
    <div className="space-y-8">
      {orderedGroups.map((group) => (
        <GoalSection
          key={group.goalId}
          group={group}
          weeklyRate={goalStats[group.goalId]?.rate}
          today={today}
          onTaskToggle={onTaskToggle}
        />
      ))}
    </div>
  );
}
