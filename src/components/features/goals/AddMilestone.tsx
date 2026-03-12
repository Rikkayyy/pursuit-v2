"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

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
    <form onSubmit={handleAdd} className="mt-4 flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a checkpoint..."
        className="flex-1 bg-secondary/50 h-14 rounded-2xl px-5 font-medium outline-none focus:bg-secondary/70 transition-all"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground active:bg-primary active:text-white transition-all disabled:opacity-50"
      >
        <Icon icon="hugeicons:add-01" className="text-xl" />
      </button>
    </form>
  );
}