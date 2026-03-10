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
                <h3 className="font-heading font-bold text-lg text-foreground">
                  {group.goalTitle}
                </h3>
              </div>
              {label && (
                <span
                  className="text-[10px] font-black uppercase tracking-tighter rounded-full px-2 py-0.5"
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
                  className={`rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer ${
                    item.isCompleted
                      ? "bg-secondary/30 border border-border/30 opacity-80"
                      : "bg-card border border-border/50 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                    style={{
                      backgroundColor: item.isCompleted
                        ? group.goalColor + "66"
                        : group.goalColor,
                    }}
                  />

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(item)}
                    disabled={loadingId === item.task.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      item.isCompleted
                        ? "text-white border-2"
                        : "border-2 border-muted-foreground/30 hover:border-current"
                    }`}
                    style={{
                      backgroundColor: item.isCompleted ? group.goalColor : "transparent",
                      borderColor: item.isCompleted ? group.goalColor : undefined,
                      ...(item.isCompleted
                        ? { boxShadow: `0 0 12px ${group.goalColor}66` }
                        : {}),
                    }}
                  >
                    {item.isCompleted && (
                      <span className="text-sm">✓</span>
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
                          style={
                            item.streak >= 7
                              ? {
                                  backgroundColor: "#f97316",
                                  color: "white",
                                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                                }
                              : {
                                  backgroundColor: group.goalColor + "15",
                                  color: group.goalColor,
                                  border: `1px solid ${group.goalColor}33`,
                                }
                          }
                        >
                          🔥 {item.streak} day{item.streak !== 1 ? "s" : ""}
                          {item.streak >= 7 ? " ultra" : " streak"}
                        </span>
                      )}
                      {item.task.type === "one_time" && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            backgroundColor: group.goalColor + "15",
                            color: group.goalColor,
                            borderColor: group.goalColor + "33",
                          }}
                        >
                          📅 One-time Task
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