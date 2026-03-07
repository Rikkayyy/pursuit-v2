"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Task } from "@/types";

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task? This will also remove all its logs.")) return;
    setLoading(id);

    await supabase.from("tasks").delete().eq("id", id);

    setLoading(null);
    router.refresh();
  };

  if (tasks.length === 0) {
    return <p className="mt-3 text-sm text-gray-600">No systems yet.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-3 group"
        >
          <div>
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-gray-600 capitalize">
              {task.type === "recurring"
                ? `${task.frequency}${task.scheduled_days?.length ? ` · ${task.scheduled_days.length} days` : ""}`
                : "One-time"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {task.type === "recurring" && (
              <span className="text-xs text-gray-600">🔁</span>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading === task.id}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}