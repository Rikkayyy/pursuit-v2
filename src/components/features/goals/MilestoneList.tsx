"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
              ? "border"
              : "bg-card border border-border/60 shadow-sm active:bg-secondary cursor-pointer"
          }`}
          style={
            milestone.is_completed
              ? { backgroundColor: goalColor + "08", borderColor: goalColor + "20" }
              : {}
          }
        >
          <button
            onClick={() => toggleMilestone(milestone)}
            disabled={loading === milestone.id}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-xs"
            style={
              milestone.is_completed
                ? { backgroundColor: goalColor, color: "white" }
                : { border: "2px solid #9ca3af80" }
            }
          >
            {milestone.is_completed && "✓"}
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
            <span className="text-xs text-muted-foreground">
              {new Date(milestone.due_date).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={() => deleteMilestone(milestone.id)}
            className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}