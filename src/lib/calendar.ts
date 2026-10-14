export type CalendarTask = {
  id: string;
  type: string;
  frequency: string | null;
  scheduled_days: number[] | null;
  due_date: string | null;
};

export type DayData = {
  completed: number;
  expected: number;
};

export type DayState = "none" | "missed" | "partial" | "full";

export type GridDate = {
  dateStr: string;
  day: number;
  inMonth: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function dateToStr(d: Date) {
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isTaskDueOn(task: CalendarTask, dateStr: string): boolean {
  if (task.type === "recurring") {
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    if (task.frequency === "daily") return true;
    if (task.frequency === "specific_days") return task.scheduled_days?.includes(dayOfWeek) ?? false;
    return false;
  }
  return task.due_date === dateStr;
}

export function getDayState(info: DayData | undefined): DayState {
  if (!info || info.expected === 0) return "none";
  if (info.completed === 0) return "missed";
  if (info.completed >= info.expected) return "full";
  return "partial";
}

// Matches getOverallStreaks: any completion keeps the streak alive, so partial days count.
export function isStreakState(state: DayState) {
  return state === "full" || state === "partial";
}

// Every date shown in the month grid, including leading/trailing days from adjacent months.
export function getGridDates(year: number, month: number): GridDate[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, i) => {
    const d = new Date(year, month, 1 - firstDayOfWeek + i, 12);
    return { dateStr: dateToStr(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

export function buildDayData(
  dates: string[],
  tasks: CalendarTask[],
  logs: { task_id: string; date: string }[]
): Record<string, DayData> {
  const result: Record<string, DayData> = {};
  for (const dateStr of dates) {
    const dueIds = new Set(tasks.filter((t) => isTaskDueOn(t, dateStr)).map((t) => t.id));
    // Only count logs for tasks due that day, so stray logs (e.g. a one-time task
    // completed on a different date) can't push a day over its expected count.
    const completed = logs.filter((l) => l.date === dateStr && dueIds.has(l.task_id)).length;
    result[dateStr] = { completed, expected: dueIds.size };
  }
  return result;
}
