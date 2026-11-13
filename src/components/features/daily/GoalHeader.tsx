function getConsistencyLabel(rate: number): {
  text: string;
  color: string;
  bg: string;
} {
  if (rate >= 90)
    return {
      text: "Consistency: High",
      color: "var(--chart-4)",
      bg: "color-mix(in srgb, var(--chart-4) 10%, transparent)",
    };
  if (rate >= 70)
    return {
      text: `${rate}% This Week`,
      color: "var(--chart-2)",
      bg: "color-mix(in srgb, var(--chart-2) 10%, transparent)",
    };
  if (rate >= 40)
    return {
      text: `${rate}% This Week`,
      color: "var(--chart-1)",
      bg: "color-mix(in srgb, var(--chart-1) 10%, transparent)",
    };
  if (rate > 0)
    return {
      text: `${rate}% This Week`,
      color: "var(--destructive)",
      bg: "color-mix(in srgb, var(--destructive) 10%, transparent)",
    };
  return {
    text: "Not Started",
    color: "var(--muted-foreground)",
    bg: "var(--secondary)",
  };
}

// A goal's title row on the daily view: color dot, title, and this week's consistency badge.
export default function GoalHeader({
  title,
  color,
  weeklyRate,
}: {
  title: string;
  color: string;
  weeklyRate?: number;
}) {
  const label = weeklyRate !== undefined ? getConsistencyLabel(weeklyRate) : null;
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
        <h3 className="font-heading font-bold text-lg text-foreground">
          {title}
        </h3>
      </div>
      {label && (
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
          style={{ color: label.color, backgroundColor: label.bg }}
        >
          {label.text}
        </span>
      )}
    </div>
  );
}
