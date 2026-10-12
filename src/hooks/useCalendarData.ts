"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOverallStreaks } from "@/lib/streaks";
import { buildDayData, getGridDates, type CalendarTask, type DayData } from "@/lib/calendar";

export function useCalendarData(open: boolean, viewYear: number, viewMonth: number) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [streaks, setStreaks] = useState<{ current: number; longest: number } | null>(null);

  // Completion data for every date in the visible grid.
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      const tasks: CalendarTask[] = (goals || []).flatMap((g) => g.tasks || []);
      setDays(buildDayData(gridDates, tasks, logs || []));
      setLoading(false);
    })();
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setStreaks(await getOverallStreaks(supabase, user.id, timezone));
    })();
  }, [open]);

  return { loading, days, streaks };
}
