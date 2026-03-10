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

  if (task.frequency === "weekly") {
    return 1;
  }

  if (task.frequency === "specific_days" && task.scheduled_days) {
    return dates.reduce((count, dateStr) => {
      const day = new Date(dateStr + "T12:00:00").getDay();
      return count + (task.scheduled_days!.includes(day) ? 1 : 0);
    }, 0);
  }

  return 0;
}

function getLast7Days(timezone: string): string[] {
  const days: string[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("en-CA", { timeZone: timezone }));
  }

  return days;
}

export async function getWeeklyHitRate(
  supabase: SupabaseClient,
  tasks: TaskForStats[],
  timezone: string = "America/Chicago"
): Promise<{ rate: number; completed: number; expected: number }> {
  const days = getLast7Days(timezone);
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
): Promise<{ date: string; count: number; total: number }[]> {
  const days = getLast7Days(timezone);
  const startDate = days[0];
  const endDate = days[days.length - 1];

  if (taskIds.length === 0) {
    return days.map((d) => ({ date: d, count: 0, total: 0 }));
  }

  const { data: logs } = await supabase
    .from("task_logs")
    .select("task_id, date")
    .in("task_id", taskIds)
    .gte("date", startDate)
    .lte("date", endDate);

  return days.map((date) => {
    const dayLogs = logs?.filter((l) => l.date === date) || [];
    return {
      date,
      count: dayLogs.length,
      total: taskIds.length,
    };
  });
}