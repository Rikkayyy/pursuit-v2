const DEFAULT_TIMEZONE = "America/Chicago";

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getSafeTimezone(rawTimezone: string | undefined): string {
  if (rawTimezone && isValidTimezone(rawTimezone)) {
    return rawTimezone;
  }
  return DEFAULT_TIMEZONE;
}

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