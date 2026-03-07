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

  if (milestones.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-600">No milestones yet.</p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3"
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
            className={`text-sm ${
              milestone.is_completed ? "text-gray-600 line-through" : "text-gray-900"
            }`}
          >
            {milestone.title}
          </span>
          {milestone.due_date && (
            <span className="ml-auto text-xs text-gray-600">
              {new Date(milestone.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}