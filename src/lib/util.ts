export function getUserToday(timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: tz }); // Returns YYYY-MM-DD
}

export function getUserDayOfWeek(timezone?: string): number {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const day = new Date(
    now.toLocaleDateString("en-US", { timeZone: tz })
  ).getDay();
  return day; // 0 = Sunday
}