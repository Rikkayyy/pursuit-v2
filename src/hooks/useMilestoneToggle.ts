"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toggleMilestone } from "@/lib/api/milestones";

export function useMilestoneToggle(milestoneId: string, isCompleted: boolean) {
  const supabase = createClient();
  const router = useRouter();
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);

  const currentCompleted = localCompleted !== null ? localCompleted : isCompleted;

  const toggle = useCallback(async () => {
    const newState = !currentCompleted;
    setLocalCompleted(newState);
    setIsPending(true);

    try {
      await toggleMilestone(supabase, milestoneId, currentCompleted);
    } catch (error) {
      console.error("Failed to toggle milestone:", error);
      setLocalCompleted(!newState);
    }

    setIsPending(false);
    router.refresh();
  }, [currentCompleted, supabase, milestoneId, router]);

  return { isCompleted: currentCompleted, isPending, toggle };
}