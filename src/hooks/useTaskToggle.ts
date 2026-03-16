"use client";

import { useOptimistic, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { logTask, unlogTask } from "@/lib/api/task-logs";

export function useTaskToggle(taskId: string, isCompleted: boolean, date: string) {
  const supabase = createClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(isCompleted);

  const toggle = () => {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);

      try {
        if (isCompleted) {
          await unlogTask(supabase, taskId, date);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await logTask(supabase, taskId, user.id, date);
        }
      } catch (error) {
        console.error("Failed to toggle task:", error);
      }

      router.refresh();
    });
  };

  return { isCompleted: optimisticCompleted, isPending, toggle };
}