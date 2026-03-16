"use client";

import { Icon } from "@iconify/react";
import TaskItem from "@/components/features/daily/TaskItem";

type DailyTask = {
  task: {
    id: string;
    title: string;
    type: string;
    goal_id: string;
  };
  goalTitle: string;
  goalColor: string;
  isCompleted: boolean;
  streak: number;
};

function getConsistencyLabel(rate: number): { text: string; color: string; bg: string } {
  if (rate >= 90) return { text: "Consistency: High", color: "var(--chart-4)", bg: "color-mix(in srgb, var(--chart-4) 10%, transparent)" };
  if (rate >= 70) return { text: `${rate}% This Week`, color: "var(--chart-2)", bg: "color-mix(in srgb, var(--chart-2) 10%, transparent)" };
  if (rate >= 40) return { text: `${rate}% This Week`, color: "var(--chart-1)", bg: "color-mix(in srgb, var(--chart-1) 10%, transparent)" };
  if (rate > 0) return { text: `${rate}% This Week`, color: "var(--destructive)", bg: "color-mix(in srgb, var(--destructive) 10%, transparent)" };
  return { text: "Not Started", color: "var(--muted-foreground)", bg: "var(--secondary)" };
}

export default function DailyTaskList({
  tasks,
  today,
  goalStats,
}: {
  tasks: DailyTask[];
  today: string;
  goalStats: Record<string, { rate: number }>;
}) {
  // Group tasks by goal
  const grouped: Record<string, { goalTitle: string; goalColor: string; goalId: string; tasks: DailyTask[] }> = {};

  tasks.forEach((t) => {
    const key = t.task.goal_id;
    if (!grouped[key]) {
      grouped[key] = {
        goalTitle: t.goalTitle,
        goalColor: t.goalColor,
        goalId: key,
        tasks: [],
      };
    }
    grouped[key].tasks.push(t);
  });

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([goalId, group]) => {
        const stats = goalStats[group.goalId];
        const label = stats ? getConsistencyLabel(stats.rate) : null;

        return (
          <section key={goalId}>
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
            <div className="space-y-3">
              {group.tasks.map((item) => (
                <TaskItem key={item.task.id} item={item} today={today} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}