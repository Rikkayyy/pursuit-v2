"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { logTask, unlogTask } from "@/lib/api/task-logs";

export function useTaskToggle(
  taskId: string,
  isCompleted: boolean,
  date: string,
  onToggle?: (taskId: string, newState: boolean) => void
) {
  const supabase = createClient();
  const router = useRouter();
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);

  const currentCompleted = localCompleted !== null ? localCompleted : isCompleted;

  const toggle = useCallback(async () => {
    const newState = !currentCompleted;
    setLocalCompleted(newState);
    setIsPending(true);

    // Notify parent immediately
    onToggle?.(taskId, newState);

    try {
      if (currentCompleted) {
        await unlogTask(supabase, taskId, date);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await logTask(supabase, taskId, user.id, date);
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
      setLocalCompleted(!newState);
      onToggle?.(taskId, !newState);
    }

    setIsPending(false);
    router.refresh();
  }, [currentCompleted, supabase, taskId, date, router, onToggle]);

  return { isCompleted: currentCompleted, isPending, toggle };
}