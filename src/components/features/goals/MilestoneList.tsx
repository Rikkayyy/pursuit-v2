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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const toggleMilestone = async (milestone: Milestone) => {
    setLoading(milestone.id);
    await supabase
      .from("milestones")
      .update({ is_completed: !milestone.is_completed })
      .eq("id", milestone.id);
    setLoading(null);
    router.refresh();
  };

  const startEdit = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setEditTitle(milestone.title);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setLoading(id);
    await supabase
      .from("milestones")
      .update({ title: editTitle.trim() })
      .eq("id", id);
    setEditingId(null);
    setLoading(null);
    router.refresh();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
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
      {milestones.map((milestone) => {
        if (editingId === milestone.id) {
          return (
            <div
              key={milestone.id}
              className="bg-white rounded-2xl p-3 shadow-xl animate-in fade-in zoom-in-95 duration-200"
              style={{
                border: `2px solid ${goalColor}`,
                boxShadow: `0 4px 20px ${goalColor}10`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs"
                  style={{
                    borderColor: milestone.is_completed ? goalColor : `${goalColor}50`,
                    backgroundColor: milestone.is_completed ? goalColor : "transparent",
                  }}
                >
                  {milestone.is_completed && (
                    <Icon icon="solar:check-read-bold" className="text-white text-xs" />
                  )}
                </div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(milestone.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 bg-transparent font-bold text-foreground outline-none border-b pb-1 focus:border-primary transition-colors"
                  style={{ borderColor: `${goalColor}30` }}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => saveEdit(milestone.id)}
                    disabled={!editTitle.trim()}
                    className="w-8 h-8 rounded-lg text-white flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: goalColor,
                      boxShadow: `0 2px 8px ${goalColor}30`,
                    }}
                  >
                    <Icon icon="solar:check-read-bold" className="text-lg" />
                  </button>
                  <button
                    onClick={() => deleteMilestone(milestone.id)}
                    className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" className="text-sm" />
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        const isCompleted = milestone.is_completed;

        return (
          <div
            key={milestone.id}
            className={`flex items-center gap-4 rounded-2xl p-4 group transition-colors cursor-pointer ${
              isCompleted
                ? ""
                : "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:bg-secondary hover:shadow-md"
            }`}
            style={{
              backgroundColor: isCompleted ? `${goalColor}08` : undefined,
              border: isCompleted ? `1px solid ${goalColor}15` : undefined,
            }}
            onClick={() => startEdit(milestone)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMilestone(milestone);
              }}
              disabled={loading === milestone.id}
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                backgroundColor: isCompleted ? goalColor : "transparent",
                border: isCompleted ? `2px solid ${goalColor}` : "2px solid #9ca3af",
              }}
            >
              {isCompleted && (
                <Icon icon="solar:check-read-bold" className="text-white text-xs" />
              )}
            </button>

            <span
              className={`flex-1 font-bold ${
                isCompleted
                  ? "text-muted-foreground line-through decoration-muted-foreground/30"
                  : "text-foreground"
              }`}
            >
              {milestone.title}
            </span>

            {milestone.due_date && (
              <Icon icon="solar:calendar-linear" className="text-muted-foreground text-sm" />
            )}
          </div>
        );
      })}
    </div>
  );
}