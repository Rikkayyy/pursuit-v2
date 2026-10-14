"use client";

import { Icon } from "@iconify/react";

export default function MonthNav({
  viewYear,
  viewMonth,
  canGoNext,
  onPrev,
  onNext,
}: {
  viewYear: number;
  viewMonth: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <button
        onClick={onPrev}
        aria-label="Previous month"
        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform tap"
      >
        <Icon icon="solar:alt-arrow-left-linear" className="text-base" />
      </button>
      <h3 className="text-sm font-heading font-bold text-foreground">{monthLabel}</h3>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next month"
        className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform tap ${
          canGoNext ? "text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
        }`}
      >
        <Icon icon="solar:alt-arrow-right-linear" className="text-base" />
      </button>
    </div>
  );
}
