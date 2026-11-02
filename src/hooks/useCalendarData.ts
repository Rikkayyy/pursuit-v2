"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOverallStreaks } from "@/lib/streaks";
import { buildDayData, getGridDates, type CalendarTask, type DayData } from "@/lib/calendar";

export function useCalendarData(open: boolean, viewYear: number, viewMonth: number, today: string) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [streaks, setStreaks] = useState<{ current: number; longest: number } | null>(null);

  // Completion data for every date in the visible grid.
  useEffect(() => {
    if (!open) return;

    // Set by the cleanup when the month changes (or the modal closes) before this
    // request finishes, so a slow, outdated response can't overwrite the newer month.
    let ignore = false;

    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Local read, no network call. Only used to filter the queries;
      // RLS still enforces access on the server.
      const user = session?.user;

      if (ignore) return;
      if (!user) {
        setLoading(false);
        return;
      }

      const gridDates = getGridDates(viewYear, viewMonth).map((d) => d.dateStr);

      const [{ data: goals }, { data: logs }] = await Promise.all([
        supabase
          .from("goals")
          .select("tasks (id, type, frequency, scheduled_days, due_date)")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("task_logs")
          .select("task_id, date")
          .eq("user_id", user.id)
          .gte("date", gridDates[0])
          .lte("date", gridDates[gridDates.length - 1]),
      ]);

      if (ignore) return;

      const tasks: CalendarTask[] = (goals || []).flatMap((g) => g.tasks || []);
      setDays(buildDayData(gridDates, tasks, logs || []));
      setLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      setStreaks(await getOverallStreaks(createClient(), today));
    })();
  }, [open, today]);

  return { loading, days, streaks };
}
