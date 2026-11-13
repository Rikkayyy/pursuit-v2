import { SupabaseClient } from "@supabase/supabase-js";
import { toDateStr } from "@/lib/calendar";

type TaskForStats = {
  id: string;
  type: string;
  frequency: string | null;
  scheduled_days: number[] | null;
  times_per_week: number | null;
};

type WeeklyTask = {
  frequency: string | null;
  scheduled_days: number[] | null;
  times_per_week: number | null;
}

export const isWeeklyTask = (task: {frequency: string | null}) =>
  task.frequency === "flexible" || task.frequency === "specific_days";

export function weeklyTarget(task: WeeklyTask): number {
  return task.frequency === "specific_days" 
    ? task.scheduled_days?.length ?? 0
    : task.times_per_week ?? 1;
}

// Sun–Sat dates for the week containing `dateStr`.
export function getWeekDates(dateStr: string) {
  const start = new Date(dateStr + "T12:00:00");
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
  });
}

// Specific-days tasks only count on their scheduled days; flexible counts any day.
export function countsTowardWeek(task: WeeklyTask, dateStr: string): boolean {
  if (task.frequency !== "specific_days") return true;
  const day = new Date(dateStr + "T12:00:00").getDay();
  return task.scheduled_days?.includes(day) ?? false;
}

function getExpectedCompletions(task: TaskForStats, dates: string[]): number {
  if (task.type !== "recurring") return 0;
  if (task.frequency === "daily") return dates.length;
  if (task.frequency === "flexible") return weeklyTarget(task);

  if (task.frequency === "specific_days" && task.scheduled_days) {
    return dates.reduce((count, dateStr) => {
      const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
      return count + (task.scheduled_days!.includes(dayOfWeek) ? 1 : 0);
    }, 0);
  }

  return 0;
}

function getCurrentWeekDays(timezone: string): string[] {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  return getWeekDates(todayStr);
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

  // Count each task's logs this week. Specific-days logs only count on scheduled days.
  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const logsPerTask = new Map<string, number>();
  for (const log of logs || []) {
    const task = tasksById.get(log.task_id);
    if (!task || !countsTowardWeek(task, log.date)) continue;
    logsPerTask.set(task.id, (logsPerTask.get(task.id) || 0) + 1);
  }

  // Each task can contribute at most its own expected count, so extra completions
  // on one task (e.g. a 4th gym session on a 3× task) can't make up for misses on another.
  let totalExpected = 0;
  let totalCompleted = 0;
  for (const task of tasks) {
    const expected = getExpectedCompletions(task, days);
    totalExpected += expected;
    totalCompleted += Math.min(logsPerTask.get(task.id) || 0, expected);
  }

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