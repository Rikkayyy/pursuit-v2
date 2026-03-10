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
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
        item.isCompleted ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"
      }`}
    >
      <button
        onClick={toggleTask}
        disabled={loading}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all"
        style={{
          borderColor: item.isCompleted ? item.goalColor : "#d1d5db",
          backgroundColor: item.isCompleted ? item.goalColor : "transparent",
        }}
      >
        {item.isCompleted && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1">
        <span
          className={`text-sm ${
            item.isCompleted ? "text-gray-400 line-through" : "text-black"
          }`}
        >
          {item.task.title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.goalColor }}
        />
        <span className="text-xs text-gray-500">{item.goalTitle}</span>
      </div>
    </div>
  );
}