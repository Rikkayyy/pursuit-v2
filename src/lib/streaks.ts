import { SupabaseClient } from "@supabase/supabase-js";

export async function getStreak(
  supabase: SupabaseClient,
  taskId: string,
  timezone: string = "America/Chicago"
): Promise<number> {
  const { data: logs } = await supabase
    .from("task_logs")
    .select("date")
    .eq("task_id", taskId)
    .order("date", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const checkDate = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const found = logs.some((log) => log.date === dateStr);

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

export async function getTaskStreaks(
  supabase: SupabaseClient,
  taskIds: string[],
  timezone: string = "America/Chicago"
): Promise<Record<string, number>> {
  const streaks: Record<string, number> = {};

  for (const id of taskIds) {
    streaks[id] = await getStreak(supabase, id, timezone);
  }

  return streaks;
}