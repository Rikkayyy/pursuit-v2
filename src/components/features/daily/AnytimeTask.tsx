"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
};

export default function AnytimeTask({ item, today }: AnytimeTaskProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleTask = async () => {
    setLoading(true);

    if (item.isCompleted) {
      await supabase
        .from("task_logs")
        .delete()
        .eq("task_id", item.task.id)
        .eq("date", today);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("task_logs").insert({
        task_id: item.task.id,
        user_id: user.id,
        date: today,
      });
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div
      className={`bg-card border rounded-2xl p-4 flex items-center gap-4 transition-all relative overflow-hidden ${
        item.isCompleted
          ? "border-border/30 opacity-80 grayscale-[0.3]"
          : "border-border/50 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{
          backgroundColor: item.isCompleted ? `${item.goalColor}66` : item.goalColor,
        }}
      />

      <button
        onClick={toggleTask}
        disabled={loading}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          borderColor: item.isCompleted ? item.goalColor : "var(--muted-foreground)",
          backgroundColor: item.isCompleted ? item.goalColor : "transparent",
        }}
      >
        {item.isCompleted && (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

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