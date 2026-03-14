"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

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
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"recurring" | "one_time">("recurring");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "specific_days">("daily");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);

    await supabase.from("tasks").insert({
      goal_id: goalId,
      title: title.trim(),
      type,
      frequency: type === "recurring" ? frequency : null,
      sort_order: nextOrder,
    });

    setTitle("");
    setType("recurring");
    setFrequency("daily");
    setLoading(false);
    setIsExpanded(false);
    router.refresh();
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full mt-4 border-2 border-dashed border-border rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10">
          <Icon
            icon="hugeicons:add-01"
            className="text-xl group-hover:scale-125 transition-transform"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          Add a system
        </span>
      </button>
    );
  }

  return (
    <div
      className="mt-4 bg-card rounded-3xl p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      style={{ border: `2px solid ${goalColor}30` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${goalColor}15`, color: goalColor }}
        >
          <Icon icon="solar:refresh-bold" />
        </div>
        <h3 className="text-base font-heading font-bold tracking-tight">New System</h3>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="w-full bg-secondary/30 border-b border-muted/50 h-12 px-1 font-bold text-base outline-none focus:border-primary transition-colors"
        placeholder="Task name (e.g., Study 30 mins)"
      />

      <div className="space-y-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          Type
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("recurring")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              type === "recurring" ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
            }`}
            style={{ backgroundColor: type === "recurring" ? goalColor : undefined }}
          >
            Recurring
          </button>
          <button
            type="button"
            onClick={() => setType("one_time")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              type === "one_time" ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
            }`}
            style={{ backgroundColor: type === "one_time" ? goalColor : undefined }}
          >
            One-time
          </button>
        </div>
      </div>

      {type === "recurring" && (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Frequency
          </span>
          <div className="flex gap-2">
            {(["daily", "weekly", "specific_days"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  frequency === f ? "text-white shadow-sm" : "bg-secondary text-secondary-foreground"
                }`}
                style={{ backgroundColor: frequency === f ? goalColor : undefined }}
              >
                {f === "daily" ? "Daily" : f === "weekly" ? "Weekly" : "Specific Days"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || !title.trim()}
          className="flex-1 h-12 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: goalColor }}
        >
          {loading ? "Adding..." : "Add System"}
        </button>
      </div>
    </div>
  );
}