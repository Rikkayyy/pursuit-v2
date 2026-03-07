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

export default function DailyTaskList({
  tasks,
  today,
}: {
  tasks: DailyTask[];
  today: string;
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
  const grouped: Record<string, { goalTitle: string; goalColor: string; tasks: DailyTask[] }> = {};

  tasks.forEach((t) => {
    const key = t.task.goal_id;
    if (!grouped[key]) {
      grouped[key] = {
        goalTitle: t.goalTitle,
        goalColor: t.goalColor,
        tasks: [],
      };
    }
    grouped[key].tasks.push(t);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([goalId, group]) => (
        <div key={goalId}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: group.goalColor }}
            />
            <h3 className="text-sm font-semibold text-gray-700">{group.goalTitle}</h3>
          </div>
          <div className="space-y-2">
            {group.tasks.map((item) => (
              <div
                key={item.task.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  item.isCompleted
                    ? "bg-gray-50 border-gray-100"
                    : "bg-white border-gray-200"
                }`}
              >
                <button
                  onClick={() => toggleTask(item)}
                  disabled={loadingId === item.task.id}
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  style={{
                    borderColor: item.isCompleted ? item.goalColor : "#d1d5db",
                    backgroundColor: item.isCompleted ? item.goalColor : "transparent",
                  }}
                >
                  {item.isCompleted && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </button>
                <div className="flex-1">
                  <span
                    className={`text-sm ${
                      item.isCompleted ? "text-gray-400 line-through" : "text-black"
                    }`}
                  >
                    {item.task.title}
                  </span>
                  {item.streak > 0 && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: item.goalColor + "15",
                        color: item.goalColor,
                      }}
                    >
                      🔥 {item.streak} day{item.streak !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {item.task.type === "one_time" && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    One-time
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}