"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import TaskForm from "@/components/features/systems/TaskForm";
import { createTask } from "@/lib/api/tasks";

export default function AddTask({
  goalId,
  nextOrder,
  goalColor = "#ff0055",
}: {
  goalId: string;
  nextOrder: number;
  goalColor?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full mt-4 border border-dashed border-muted-foreground/20 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-muted-foreground/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group active:scale-[0.98] tap"
      >
        <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10">
          <Icon
            icon="hugeicons:add-01"
            className="text-sm group-hover:scale-125 transition-transform"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
          Add a system
        </span>
      </button>
    );
  }

  return (
    <div className="mt-4">
      <TaskForm
        goalColor={goalColor}
        onSave={async (data) => {
          try {
            await createTask(supabase, {
              goal_id: goalId,
              title: data.title,
              type: data.type,
              frequency: data.type === "recurring" ? data.frequency : null,
              scheduled_days: data.type === "recurring" ? data.scheduled_days : null,
              times_per_week: data.type === "recurring" ? data.times_per_week : null,
              sort_order: nextOrder,
            });
          } catch (error) {
            console.error("Failed to create task:", error);
            return; // keep the form open so the user's input isn't lost
          }
          setIsExpanded(false);
          router.refresh();
        }}
        onCancel={() => setIsExpanded(false)}
      />
    </div>
  );
}