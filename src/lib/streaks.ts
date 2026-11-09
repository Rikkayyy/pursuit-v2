import { SupabaseClient } from "@supabase/supabase-js";

export function countStreak(dates: string[], todayStr: string): number {
  const dateSet = new Set(dates);
  const checkDate = new Date(todayStr + "T00:00:00");

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const found = dateSet.has(dateStr);

    if (found) {
      streak++;
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function countSpecificDaysStreak(
  dates: string[],
  todayStr: string,
  scheduledDays: number[]
): number {
  if (scheduledDays.length === 0) return 0;
  const logged = new Set(dates);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const weekStart = new Date(todayStr + "T12:00:00");
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  let streak = 0;
  for (let w = 0; w < 104; w++) {
    const allDone = scheduledDays.every((day) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + day);
      return logged.has(fmt(d));
    });

    if (allDone) {
      streak++;
    } else if (w > 0) {
      break; // a past week with a missed scheduled day ends the streak
    }
    // w === 0 and not all done yet: current week is still in progress, keep going

    weekStart.setDate(weekStart.getDate() - 7);
  }
  return streak;
}


type StreakTask = {
  id: string;
  frequency: string | null;
  scheduled_days: number[] | null;
};

export async function getTaskStreaks(
  supabase: SupabaseClient,
  tasks: StreakTask[],
  timezone: string = "America/Chicago"
): Promise<Record<string, number>> {
  const streaks: Record<string, number> = {};

  if (tasks.length === 0) {
    return streaks;
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone });

  const flexibleIds = tasks.filter((t) => t.frequency === "flexible").map((t) => t.id);
  const otherIds = tasks.filter((t) => t.frequency !== "flexible").map((t) => t.id);

  const [logsResult, flexibleResult] = await Promise.all([
    otherIds.length > 0
      ? supabase
          .from("task_logs")
          .select("task_id, date")
          .in("task_id", otherIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] as { task_id: string; date: string }[], error: null }),
    flexibleIds.length > 0
      ? supabase.rpc("get_flexible_streaks", { p_task_ids: flexibleIds, p_today: todayStr })
      : Promise.resolve({ data: [] as { task_id: string; streak: number }[], error: null }),
  ]);

  // Flexible: one row per task from the SQL function.
  if (flexibleResult.error) {
    console.error("get_flexible_streaks failed", flexibleResult.error);
  }
  for (const row of (flexibleResult.data || []) as { task_id: string; streak: number }[]) {
    streaks[row.task_id] = row.streak;
  }

  // Daily / specific days: group logs by task, then count in JS.
  const grouped: Record<string, string[]> = {};
  for (const log of logsResult.data || []) {
    (grouped[log.task_id] ??= []).push(log.date);
  }

  for (const task of tasks) {
    if (task.frequency === "flexible") continue; // already set above

    const logs = grouped[task.id] || [];
    streaks[task.id] =
      task.frequency === "specific_days"
        ? countSpecificDaysStreak(logs, todayStr, task.scheduled_days || [])
        : countStreak(logs, todayStr);
  }

  return streaks;
}


// A day counts toward the overall streak if any task was completed that day,
// regardless of how many tasks were due — showing up counts.
// Computed in Postgres (supabase/migrations/20261014_overall_streaks.sql) so it
// isn't cut off by the 1000-row API cap. Scoped to the signed-in user via auth.uid().
export async function getOverallStreaks(
  supabase: SupabaseClient,
  todayStr: string
): Promise<{ current: number; longest: number } | null> {
  const { data, error } = await supabase.rpc("get_overall_streaks", { p_today: todayStr });

  if (error || !data?.[0]) {
    console.error("get_overall_streaks failed", error);
    return null;
  }

  return { current: data[0].current_streak, longest: data[0].longest_streak };
}
