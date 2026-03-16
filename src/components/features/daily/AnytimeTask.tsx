"use client";

import { Icon } from "@iconify/react";
import { useTaskToggle } from "@/hooks/useTaskToggle";

type AnytimeTaskProps = {
  item: {
    task: {
      id: string;
      title: string;
      type: string;
      goal_id: string;
    };
    goalTitle: string;
    goalColor: string;
    isCompleted: boolean;
  };
  today: string;
  onToggle?: (taskId: string, newState: boolean) => void;
};

export default function AnytimeTask({ item, today, onToggle }: AnytimeTaskProps) {
  const { isCompleted, isPending, toggle } = useTaskToggle(
    item.task.id,
    item.isCompleted,
    today,
    onToggle
  );

  return (
    <div
      className={`bg-card rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden ${
        isCompleted
          ? "shadow-none opacity-80 grayscale-[0.3]"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-[0.98] cursor-pointer"
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
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          borderColor: isCompleted ? item.goalColor : "var(--muted-foreground)",
          backgroundColor: isCompleted ? item.goalColor : "transparent",
        }}
      >
        {isCompleted && (
          <Icon icon="solar:check-read-bold" className="text-white text-base" />
        )}
      </button>

      <div className="flex-1">
        <h4
          className={`font-bold text-base leading-tight ${
            isCompleted
              ? "text-muted-foreground line-through decoration-muted-foreground/40"
              : "text-foreground"
          }`}
        >
          {item.task.title}
        </h4>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.goalColor }}
        />
        <span className="text-xs text-muted-foreground font-medium">{item.goalTitle}</span>
      </div>
    </div>
  );
}