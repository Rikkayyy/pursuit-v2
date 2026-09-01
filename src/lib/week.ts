function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getWeekStart(date: string): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() - d.getDay());
  return formatDate(d);
}