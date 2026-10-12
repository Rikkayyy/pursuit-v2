"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function DateSelector({
  currentDate,
  today,
  onOpenCalendar,
}: {
  currentDate: string;
  today: string;
  onOpenCalendar: () => void;
}) {
  const router = useRouter();

  const goToDate = (offset: number) => {
    const date = new Date(currentDate + "T12:00:00");
    date.setDate(date.getDate() + offset);
    const newDate = date.toISOString().split("T")[0];
    router.push(`/?date=${newDate}`);
  };

  const goToToday = () => {
    router.push("/");
  };

  const isToday = currentDate === today;
  const isFuture = currentDate > today;

  const displayDate = new Date(currentDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => goToDate(-1)}
        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform tap"
      >
        <Icon icon="solar:arrow-left-linear" className="text-xl" />
      </button>

      <div className="flex-1 flex flex-col items-center">
        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-1.5 text-sm font-bold text-foreground active:scale-95 transition-transform tap"
        >
          <Icon icon="solar:calendar-linear" className="text-base text-primary" />
          {isToday ? "Today" : displayDate}
        </button>
        {!isToday && (
          <button
            onClick={goToToday}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors tap"
          >
            Back to today
          </button>
        )}
      </div>

      <button
        onClick={() => goToDate(1)}
        disabled={isToday}
        className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform tap ${
          isToday
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-foreground"
        }`}
      >
        <Icon icon="solar:arrow-right-linear" className="text-xl" />
      </button>
    </div>
  );
}