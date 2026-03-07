"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <form onSubmit={handleAdd} className="mt-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a system..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "recurring" | "one_time")}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-black focus:outline-none"
        >
          <option value="recurring">Recurring</option>
          <option value="one_time">One-time</option>
        </select>
        {type === "recurring" && (
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "specific_days")}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-black focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="specific_days">Specific Days</option>
          </select>
        )}
      </div>
    </form>
  );
}