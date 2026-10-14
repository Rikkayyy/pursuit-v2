"use client";

import type { DayState } from "@/lib/calendar";
import { CALENDAR_COLORS as COLORS } from "./colors";

function getDayColors(state: DayState, inMonth: boolean, isSelected: boolean, isFuture: boolean) {
  if (isSelected) return { bg: COLORS.primary, color: "#ffffff" };
  if (isFuture) return { bg: "transparent", color: COLORS.faintText };
  switch (state) {
    case "full":
      return { bg: COLORS.fullBg, color: COLORS.fullText };
    case "partial":
      return { bg: COLORS.partialBg, color: COLORS.partialText };
    case "missed":
      return { bg: COLORS.missedBg, color: inMonth ? COLORS.mutedText : COLORS.faintText };
    default:
      return { bg: "transparent", color: inMonth ? COLORS.mutedText : COLORS.faintText };
  }
}

export default function CalendarDay({
  day,
  state,
  inMonth,
  isSelected,
  isToday,
  isFuture,
  connectLeft,
  connectRight,
  onSelect,
}: {
  day: number;
  state: DayState;
  inMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  connectLeft: boolean;
  connectRight: boolean;
  onSelect: () => void;
}) {
  const { bg, color } = getDayColors(state, inMonth, isSelected, isFuture);

  return (
    <div className="relative flex items-center justify-center py-1">
      {(connectLeft || connectRight) && (
        <div
          className="absolute top-1 bottom-1"
          style={{
            backgroundColor: COLORS.band,
            left: connectLeft ? 0 : "50%",
            right: connectRight ? 0 : "50%",
          }}
        />
      )}
      <button
        onClick={onSelect}
        disabled={isFuture}
        className={`relative w-10 h-10 rounded-full flex flex-col items-center justify-center text-sm font-heading font-bold transition-transform ${
          isFuture ? "cursor-not-allowed" : "active:scale-90 tap"
        } ${isSelected ? "shadow-[0_4px_12px_rgba(255,0,85,0.4)]" : ""}`}
        style={{
          backgroundColor: bg,
          color,
          opacity: !inMonth && !isSelected ? 0.5 : 1,
        }}
      >
        {day}
        {isToday && !isSelected && (
          <span
            className="absolute bottom-1 w-1 h-1 rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          />
        )}
      </button>
    </div>
  );
}
