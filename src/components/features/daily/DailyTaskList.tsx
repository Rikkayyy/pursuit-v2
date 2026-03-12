"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

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
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleTask = async (task: DailyTask) => {
    setLoadingId(task.task.id);

    if (task.isCompleted) {
      await supabase
        .from("task_logs")
        .delete()
        .eq("task_id", task.task.id)
        .eq("date", today);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("task_logs").insert({
        task_id: task.task.id,
        user_id: user.id,
        date: today,
      });
    }

    setLoadingId(null);
    router.refresh();
  };

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
                <div
                  key={item.task.id}
                  className={`rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden group ${
                    item.isCompleted
                      ? "bg-secondary/30 border border-border/30 opacity-80 grayscale-[0.3]"
                      : "bg-card border border-border/50 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                    style={{
                      backgroundColor: item.isCompleted ? `${item.goalColor}66` : item.goalColor,
                    }}
                  />

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(item)}
                    disabled={loadingId === item.task.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      item.isCompleted
                        ? "text-white"
                        : "border-2 border-muted-foreground/30 group-hover:border-current group-hover:bg-current/5"
                    }`}
                    style={{
                      backgroundColor: item.isCompleted ? item.goalColor : "transparent",
                      borderColor: item.isCompleted ? item.goalColor : undefined,
                      boxShadow: item.isCompleted ? `0 0 12px ${item.goalColor}66` : "none",
                      // @ts-expect-error CSS custom property for hover
                      "--tw-text-opacity": 1,
                      color: item.isCompleted ? "white" : undefined,
                    }}
                  >
                    {item.isCompleted && (
                      <Icon icon="solar:check-read-bold" className="text-base" />
                    )}
                    {!item.isCompleted && (
                      <Icon icon="hugeicons:add-01" className="text-transparent group-hover:text-current text-sm" style={{ color: item.goalColor }} />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-base leading-tight ${
                        item.isCompleted
                          ? "text-muted-foreground line-through decoration-muted-foreground/40 tracking-tight"
                          : "text-foreground"
                      }`}
                    >
                      {item.task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      {item.streak > 0 && item.isCompleted && (
                        <span className="flex items-center gap-1.5 bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-chart-2/20">
                          <Icon icon="solar:fire-bold" className="text-xs" />
                          {item.streak} Day Streak
                        </span>
                      )}
                      {item.streak > 0 && !item.isCompleted && item.streak >= 7 && (
                        <span className="flex items-center gap-1.5 bg-chart-2 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-chart-2/30 animate-pulse">
                          <Icon icon="solar:fire-bold" className="text-sm" />
                          {item.streak} Day Ultra
                        </span>
                      )}
                      {item.streak > 0 && !item.isCompleted && item.streak < 7 && (
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

                  {/* Menu button (uncompleted only) */}
                  {!item.isCompleted && (
                    <button className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <Icon icon="solar:menu-dots-bold" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}