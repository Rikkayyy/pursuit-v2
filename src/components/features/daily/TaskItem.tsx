"use client";

import { Icon } from "@iconify/react";
import { useTaskToggle } from "@/hooks/useTaskToggle";

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

export default function TaskItem({
  item,
  today,
}: {
  item: DailyTask;
  today: string;
}) {
  const { isCompleted, isPending, toggle } = useTaskToggle(
    item.task.id,
    item.isCompleted,
    today
  );

  return (
    <div
      className={`rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden group ${
        isCompleted
          ? "bg-secondary/30 shadow-none opacity-80 grayscale-[0.3]"
          : "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-[0.98] cursor-pointer"
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{
          backgroundColor: isCompleted ? `${item.goalColor}66` : item.goalColor,
        }}
      />

      <button
        onClick={toggle}
        disabled={isPending}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isCompleted
            ? "text-white"
            : "border-2 border-muted-foreground/30 group-hover:border-current group-hover:bg-current/5"
        }`}
        style={{
          backgroundColor: isCompleted ? item.goalColor : "transparent",
          borderColor: isCompleted ? item.goalColor : undefined,
          boxShadow: isCompleted ? `0 0 12px ${item.goalColor}66` : "none",
        }}
      >
        {isCompleted && (
          <Icon icon="solar:check-read-bold" className="text-base" />
        )}
        {!isCompleted && (
          <Icon icon="hugeicons:add-01" className="text-transparent group-hover:text-current text-sm" style={{ color: item.goalColor }} />
        )}
      </button>

      <div className="flex-1">
        <h4
          className={`font-bold text-base leading-tight ${
            isCompleted
              ? "text-muted-foreground line-through decoration-muted-foreground/40 tracking-tight"
              : "text-foreground"
          }`}
        >
          {item.task.title}
        </h4>
        <div className="flex items-center gap-2 mt-2">
          {item.streak > 0 && isCompleted && (
            <span className="flex items-center gap-1.5 bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-chart-2/20">
              <Icon icon="solar:fire-bold" className="text-xs" />
              {item.streak} Day Streak
            </span>
          )}
          {item.streak > 0 && !isCompleted && item.streak >= 7 && (
            <span className="flex items-center gap-1.5 bg-chart-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-chart-2/30 animate-pulse">
              <Icon icon="solar:fire-bold" className="text-sm" />
              {item.streak} Day Ultra
            </span>
          )}
          {item.streak > 0 && !isCompleted && item.streak < 7 && (
            <span className="flex items-center gap-1 text-muted-foreground/60 text-[10px] font-bold tracking-tight">
              <Icon icon="solar:fire-linear" className="text-xs" />
              {item.streak} day streak
            </span>
          )}
          {item.task.type === "one_time" && (
            <span className="flex items-center gap-1 bg-chart-4/10 text-chart-4 px-2 py-0.5 rounded-full text-[10px] font-bold border border-chart-4/20">
              <Icon icon="solar:calendar-bold" className="text-sm" />
              One-time Task
            </span>
          )}
        </div>
      </div>
    </div>
  );
}