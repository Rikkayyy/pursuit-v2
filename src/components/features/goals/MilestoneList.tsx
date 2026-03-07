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
    return <p className="mt-3 text-sm text-gray-600">No milestones yet.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3 group"
        >
          <button
            onClick={() => toggleMilestone(milestone)}
            disabled={loading === milestone.id}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all"
            style={{
              borderColor: milestone.is_completed ? goalColor : "#d1d5db",
              backgroundColor: milestone.is_completed ? goalColor : "transparent",
            }}
          >
            {milestone.is_completed && (
              <span className="text-white text-xs">✓</span>
            )}
          </button>
          <span
            className={`flex-1 text-sm ${
              milestone.is_completed ? "text-gray-400 line-through" : "text-black"
            }`}
          >
            {milestone.title}
          </span>
          {milestone.due_date && (
            <span className="text-xs text-gray-600">
              {new Date(milestone.due_date).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={() => deleteMilestone(milestone.id)}
            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}