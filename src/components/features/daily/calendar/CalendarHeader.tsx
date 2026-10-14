"use client";

import { Icon } from "@iconify/react";
import { CALENDAR_COLORS as COLORS } from "./colors";

function formatDays(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-secondary rounded-2xl px-3.5 py-3">
      <Icon icon={icon} className="text-lg flex-shrink-0" style={{ color: iconColor }} />
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-sm font-heading font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default function CalendarHeader({
  selectedDate,
  streaks,
  onClose,
}: {
  selectedDate: string;
  streaks: { current: number; longest: number } | null;
  onClose: () => void;
}) {
  const selectedDateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#fff0f4] to-transparent">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] block mb-1">
            Select a Date
          </span>
          <h2 className="text-2xl font-heading font-extrabold text-foreground tracking-tight">
            {selectedDateLabel}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {streaks && streaks.current > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: COLORS.fullBg, color: COLORS.primary }}
            >
              <Icon icon="solar:fire-bold" className="text-sm" />
              {streaks.current}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform tap"
          >
            <Icon icon="solar:close-linear" className="text-base" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <StatCard
          icon="solar:fire-linear"
          iconColor={COLORS.primary}
          label="Current"
          value={streaks ? formatDays(streaks.current) : "—"}
        />
        <StatCard
          icon="solar:bolt-linear"
          iconColor={COLORS.partialText}
          label="Best"
          value={streaks ? formatDays(streaks.longest) : "—"}
        />
      </div>
    </div>
  );
}
