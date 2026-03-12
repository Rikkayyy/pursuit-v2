"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  if (rate >= 90) return { text: "CONSISTENCY: HIGH", color: "#16a34a", bg: "#f0fdf4" };
  if (rate >= 70) return { text: `${rate}% THIS WEEK`, color: "#ea580c", bg: "#fff7ed" };
  if (rate >= 40) return { text: `${rate}% THIS WEEK`, color: "#d97706", bg: "#fffbeb" };
  if (rate > 0) return { text: `${rate}% THIS WEEK`, color: "#dc2626", bg: "#fef2f2" };
  return { text: "NOT STARTED", color: "#9ca3af", bg: "#f3f4f6" };
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
                  className={`bg-card border rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden group ${
                    item.isCompleted
                      ? "border-border/30 opacity-80 grayscale-[0.3]"
                      : "border-border/50 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
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
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: item.isCompleted ? item.goalColor : "var(--muted-foreground)",
                      backgroundColor: item.isCompleted ? item.goalColor : "transparent",
                      boxShadow: item.isCompleted ? `0 0 12px ${item.goalColor}66` : "none",
                    }}
                  >
                    {item.isCompleted && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <h4
                      className={`font-bold text-base leading-tight ${
                        item.isCompleted
                          ? "text-muted-foreground line-through decoration-muted-foreground/40"
                          : "text-foreground"
                      }`}
                    >
                      {item.task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      {item.streak > 0 && (
                        <span
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: item.isCompleted ? `${item.goalColor}15` : `var(--chart-2)`,
                            color: item.isCompleted ? item.goalColor : "white",
                            boxShadow: item.isCompleted ? "none" : "0 4px 12px rgba(249, 115, 22, 0.3)",
                          }}
                        >
                          🔥 {item.streak} Day{item.streak !== 1 ? "s" : ""}
                        </span>
                      )}
                      {item.task.type === "one_time" && (
                        <span className="flex items-center gap-1 bg-chart-4/10 text-chart-4 px-2 py-0.5 rounded-full text-[10px] font-bold border border-chart-4/20">
                          One-time Task
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}