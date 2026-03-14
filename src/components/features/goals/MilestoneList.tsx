"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import type { Milestone } from "@/types";

export default function MilestoneList({
  milestones,
  goalColor,
}: {
  milestones: Milestone[];
  goalColor: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleMilestone = async (milestone: Milestone) => {
    setLoading(milestone.id);
    await supabase
      .from("milestones")
      .update({ is_completed: !milestone.is_completed })
      .eq("id", milestone.id);
    setLoading(null);
    router.refresh();
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    setLoading(id);
    await supabase.from("milestones").delete().eq("id", id);
    setLoading(null);
    router.refresh();
  };

  if (milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones yet.</p>;
  }

  return (
    <div className="space-y-3">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={`flex items-center gap-4 rounded-2xl p-4 group transition-colors ${
            milestone.is_completed
              ? "bg-secondary/20"
              : "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:bg-secondary cursor-pointer"
          }`}
          style={{
            backgroundColor: milestone.is_completed ? `${goalColor}08` : undefined,
            borderColor: milestone.is_completed ? `${goalColor}20` : undefined,
          }}
        >
          <button
            onClick={() => toggleMilestone(milestone)}
            disabled={loading === milestone.id}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              backgroundColor: milestone.is_completed ? goalColor : "transparent",
              border: milestone.is_completed ? `2px solid ${goalColor}` : "2px solid #9ca3af",
            }}
          >
            {milestone.is_completed && (
              <Icon icon="solar:check-read-bold" className="text-white text-xs" />
            )}
          </button>
          <span
            className={`flex-1 font-bold ${
              milestone.is_completed
                ? "text-muted-foreground line-through decoration-muted-foreground/30"
                : "text-foreground"
            }`}
          >
            {milestone.title}
          </span>
          {milestone.due_date && (
            <Icon icon="solar:calendar-linear" className="text-muted-foreground text-sm" />
          )}
          <button
            onClick={() => deleteMilestone(milestone.id)}
            className="text-muted-foreground/30 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-all"
          >
            <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
          </button>
        </div>
      ))}
    </div>
  );
}