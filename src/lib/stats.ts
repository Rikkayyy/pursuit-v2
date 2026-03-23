import { SupabaseClient } from "@supabase/supabase-js";

type TaskForStats = {
  id: string;
  type: string;
  frequency: string | null;
  scheduled_days: number[] | null;
};

export type DailyStat = {
  date: string; // YYYY-MM-DD
  completed: number;
  expected: number;
  rate: number; // 0–100
};

function getExpectedCompletions(task: TaskForStats, date: string): number {
  if (task.type !== "recurring") return 0;

  if (task.frequency === "daily") return 1;

  if (task.frequency === "weekly") {
    const day = new Date(date + "T12:00:00").getDay();
    return day === 1 ? 1 : 0; // Monday
  }

  if (task.frequency === "specific_days" && task.scheduled_days) {
    const day = new Date(date + "T12:00:00").getDay();
    return task.scheduled_days.includes(day) ? 1 : 0;
  }

  return 0;
}

function buildDateRange(
  startDate: string,
  endDate: string,
  timezone: string
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  while (current <= end) {
    dates.push(current.toLocaleDateString("en-CA", { timeZone: timezone }));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function getDailyStats(
  supabase: SupabaseClient,
  tasks: TaskForStats[],
  startDate: string,
  endDate: string,
  timezone: string
): Promise<DailyStat[]> {
  const recurringTasks = tasks.filter((t) => t.type === "recurring");
  const taskIds = recurringTasks.map((t) => t.id);

  const dates = buildDateRange(startDate, endDate, timezone);

  if (taskIds.length === 0) {
    return dates.map((date) => ({ date, completed: 0, expected: 0, rate: 0 }));
  }

  const { data: logs } = await supabase
    .from("task_logs")
    .select("task_id, date")
    .in("task_id", taskIds)
    .gte("date", startDate)
    .lte("date", endDate);

  const logsByDate = new Map<string, number>();
  for (const log of logs || []) {
    logsByDate.set(log.date, (logsByDate.get(log.date) || 0) + 1);
  }

  return dates.map((date) => {
    const expected = recurringTasks.reduce(
      (sum, task) => sum + getExpectedCompletions(task, date),
      0
    );
    const completed = logsByDate.get(date) || 0;
    const rate =
      expected === 0 ? 0 : Math.min(Math.round((completed / expected) * 100), 100);

    return { date, completed, expected, rate };
  });
}
