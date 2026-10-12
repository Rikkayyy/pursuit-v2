import { SupabaseClient } from "@supabase/supabase-js";

type TaskForStats = {
  id: string;
  type: string;
  frequency: string | null;
  scheduled_days: number[] | null;
};

function getExpectedCompletions(task: TaskForStats, dates: string[]): number {
  if (task.type !== "recurring") return 0;

  if (task.frequency === "daily") {
    return dates.length;
  }

  if (task.frequency === "specific_days" && task.scheduled_days) {
    return dates.reduce((count, dateStr) => {
      const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
      return count + (task.scheduled_days!.includes(dayOfWeek) ? 1 : 0);
    }, 0);
  }

  return 0;
}

function getCurrentWeekDays(timezone: string): string[] {
  const days: string[] = [];
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const today = new Date(todayStr + "T12:00:00");
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Go back to Sunday
  const sunday = new Date(today);
  sunday.setDate(sunday.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }

  return days;
}

export async function getWeeklyHitRate(
  supabase: SupabaseClient,
  tasks: TaskForStats[],
  timezone: string = "America/Chicago"
): Promise<{ rate: number; completed: number; expected: number }> {
  const days = getCurrentWeekDays(timezone);
  const startDate = days[0];
  const endDate = days[days.length - 1];

  // Get all task IDs
  const taskIds = tasks.map((t) => t.id);
  if (taskIds.length === 0) return { rate: 0, completed: 0, expected: 0 };

  // Fetch logs for the past 7 days
  const { data: logs } = await supabase
    .from("task_logs")
    .select("task_id, date")
    .in("task_id", taskIds)
    .gte("date", startDate)
    .lte("date", endDate);

  // Calculate expected completions
  let totalExpected = 0;
  tasks.forEach((task) => {
    totalExpected += getExpectedCompletions(task, days);
  });

  const totalCompleted = logs?.length || 0;

  if (totalExpected === 0) return { rate: 0, completed: 0, expected: 0 };

  const rate = Math.round((totalCompleted / totalExpected) * 100);

  return {
    rate: Math.min(rate, 100),
    completed: totalCompleted,
    expected: totalExpected,
  };
}

export async function getDailyCompletions(
  supabase: SupabaseClient,
  taskIds: string[],
  timezone: string = "America/Chicago"
): Promise<{ date: string; count: number; total: number; isFuture: boolean }[]> {
  const days = getCurrentWeekDays(timezone);
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const startDate = days[0];
  const endDate = todayStr; // Only fetch up to today

  if (taskIds.length === 0) {
    return days.map((d) => ({ date: d, count: 0, total: 0, isFuture: d > todayStr }));
  }

  const { data: logs } = await supabase
    .from("task_logs")
    .select("task_id, date")
    .in("task_id", taskIds)
    .gte("date", startDate)
    .lte("date", endDate);

  return days.map((date) => {
    const isFuture = date > todayStr;
    if (isFuture) {
      return { date, count: 0, total: 0, isFuture: true };
    }
    const dayLogs = logs?.filter((l) => l.date === date) || [];
    return {
      date,
      count: dayLogs.length,
      total: taskIds.length,
      isFuture: false,
    };
  });
}