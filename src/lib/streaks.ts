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

function countSpecificDaysStreak (
  dates: string[],
  todayStr: string,
  scheduledDays: number[]
): number {
  if (scheduledDays.length === 0) return 0;
  const dateSet = new Set(dates);
  const sortedDays = [...scheduledDays].sort((a, b) => a - b);

  const today = new Date(todayStr + "T00:00:00");
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  let streak = 0;
  let isCurrentWeek = true;

  for (let w = 0; w < 104; w++) {
    const weekDueDates = sortedDays.map((day) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + day);
      return d.toISOString().split("T")[0];
    });

    // Only judge due-dates that have actually happened by today — a scheduled
    // day later this week hasn't occurred yet, so it can't count against you.
    const elapsedDueDates = weekDueDates.filter((d) => d <= todayStr);

    if (isCurrentWeek && elapsedDueDates.length === 0) {
      // Nothing scheduled has happened yet this week — too early to judge,
      // move on to last week without counting or breaking.
      isCurrentWeek = false;
      weekStart.setDate(weekStart.getDate() - 7);
      continue;
    }

     const allCompleted = elapsedDueDates.every((d) => dateSet.has(d));

     if (allCompleted) {
      streak++;
     } else {
      break;
     }

     isCurrentWeek = false;
    weekStart.setDate(weekStart.getDate() - 7);
  }

  return streak;
}

type StreakTask = {
  id: string;
  frequency: string | null;
  scheduled_days: number[] | null;
}


export async function getTaskStreaks(
  supabase: SupabaseClient,
  tasks: StreakTask[],
  timezone: string = "America/Chicago"
): Promise<Record<string, number>> {
  const streaks: Record<string, number> = {};

  if (tasks.length === 0) {
    return streaks;
  }

  const taskIds = tasks.map((t) => t.id);

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

  for (const task of tasks) {
    const logs = grouped[task.id] || [];
    streaks[task.id] = task.frequency === "specific_days"
    ? countSpecificDaysStreak(logs, todayStr, task.scheduled_days || [])
    : countStreak(logs, todayStr);
  }

  return streaks;
}

// A day counts toward the overall streak if any task was completed that day,
// regardless of how many tasks were due — showing up counts.
export async function getOverallStreaks(
  supabase: SupabaseClient,
  userId: string,
  timezone: string = "America/Chicago"
): Promise<{ current: number; longest: number }> {
  const { data } = await supabase
    .from("task_logs")
    .select("date")
    .eq("user_id", userId);

  const uniqueDates = Array.from(new Set((data || []).map((d) => d.date))).sort();

  if (uniqueDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + "T00:00:00");
    const curr = new Date(uniqueDates[i] + "T00:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const current = countStreak(uniqueDates, todayStr);

  return { current, longest };
}