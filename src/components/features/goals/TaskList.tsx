"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Task } from "@/types";

export default function TaskList({ tasks, goalColor }: { tasks: Task[]; goalColor: string }) {
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
    return <p className="text-sm text-muted-foreground">No systems yet.</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-heading font-bold text-lg">{task.title}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                {task.type === "recurring"
                  ? `${task.frequency}${task.scheduled_days?.length ? ` · ${task.scheduled_days.length} days/week` : ""}`
                  : "One-time task"}
              </p>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading === task.id}
              className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}