"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { Task } from "@/types";
import TaskForm from "@/components/features/systems/TaskForm";

export default function TaskList({ tasks, goalColor }: { tasks: Task[]; goalColor: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    <div className="space-y-3">
      {tasks.map((task) => {
        if (editingId === task.id) {
          return (
            <TaskForm
              key={task.id}
              goalColor={goalColor}
              initialData={{
                title: task.title,
                type: task.type,
                frequency: (task.frequency as "daily" | "weekly" | "specific_days") || "daily",
              }}
              headerLabel="Edit System"
              headerIcon="solar:pen-bold"
              saveLabel="Save Changes"
              savingLabel="Saving..."
              onSave={async (data) => {
                await supabase
                  .from("tasks")
                  .update({
                    title: data.title,
                    type: data.type,
                    frequency: data.type === "recurring" ? data.frequency : null,
                  })
                  .eq("id", task.id);
                setEditingId(null);
                router.refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          );
        }

        return (
          <div
            key={task.id}
            className="group bg-card rounded-[1.5rem] p-4 flex items-center gap-4 relative overflow-hidden transition-all hover:shadow-md shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            style={{ borderLeft: `4px solid ${goalColor}` }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform"
              style={{ backgroundColor: `${goalColor}15`, color: goalColor }}
            >
              <Icon icon={task.type === "recurring" ? "solar:refresh-bold" : "solar:calendar-bold"} className="text-xl" />
            </div>
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setEditingId(task.id)}
            >
              <h3 className="font-heading font-bold text-base leading-tight hover:text-primary/80 transition-colors">{task.title}</h3>
              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                <span className="flex items-center gap-1">
                  <Icon icon="solar:calendar-bold" style={{ color: `${goalColor}99` }} />
                  {task.type === "recurring"
                    ? task.frequency === "specific_days" && task.scheduled_days
                      ? task.scheduled_days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
                      : task.frequency === "daily"
                      ? "Every Day"
                      : "Weekly"
                    : "One-time Task"}
                </span>
              </div>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading === task.id}
              className="w-10 h-10 rounded-xl bg-secondary/50 text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}