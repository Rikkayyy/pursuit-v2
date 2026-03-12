"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function AddTask({ goalId, nextOrder }: { goalId: string; nextOrder: number }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"recurring" | "one_time">("recurring");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "specific_days">("daily");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleAdd} className="mt-4 space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a system..."
          className="flex-1 bg-secondary/50 h-14 rounded-2xl px-5 font-medium outline-none focus:bg-secondary/70 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground active:bg-primary active:text-white transition-all disabled:opacity-50"
        >
          <Icon icon="hugeicons:add-01" className="text-xl" />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("recurring")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            type === "recurring"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Recurring
        </button>
        <button
          type="button"
          onClick={() => setType("one_time")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            type === "one_time"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          One-time
        </button>
        {type === "recurring" && (
          <div className="flex gap-2 ml-2">
            {(["daily", "weekly", "specific_days"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  frequency === f
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {f === "daily" ? "Daily" : f === "weekly" ? "Weekly" : "Custom"}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}