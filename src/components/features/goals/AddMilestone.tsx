"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AddMilestone({ goalId, nextOrder }: { goalId: string; nextOrder: number }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    await supabase.from("milestones").insert({
      goal_id: goalId,
      title: title.trim(),
      sort_order: nextOrder,
    });

    setTitle("");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleAdd} className="mt-3 flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a milestone..."
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}