"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
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
    return <p className="text-sm text-muted-foreground">No systems yet.</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-heading font-bold text-lg">{task.title}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {task.type === "recurring"
                  ? `${task.frequency === "specific_days" && task.scheduled_days
                      ? task.scheduled_days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
                      : task.frequency === "daily"
                      ? "Every Day"
                      : "Weekly"
                    }`
                  : "One-time Task"}
              </p>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading === task.id}
              className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Icon icon="solar:trash-bin-trash-linear" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}