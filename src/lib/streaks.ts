import { SupabaseClient } from "@supabase/supabase-js";

function countStreak(dates: string[], todayStr: string): number {
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

export async function getTaskStreaks(
  supabase: SupabaseClient,
  taskIds: string[],
  timezone: string = "America/Chicago"
): Promise<Record<string, number>> {
  const streaks: Record<string, number> = {};

  if (taskIds.length === 0) {
    return streaks;
  }

  const grouped: Record<string, string[]> = {};
  const { data: taskLogs } = await supabase
    .from("task_logs")
    .select("task_id, date")
    .in("task_id", taskIds)
    .order("date", { ascending: false });

  for (const log of taskLogs || []) {
    if (!grouped[log.task_id]) {
      grouped[log.task_id] = [];
    }

    grouped[log.task_id].push(log.date);
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });

  for (const taskId of taskIds) {
    streaks[taskId] = countStreak(grouped[taskId] || [], todayStr);
  }

  return streaks;
}