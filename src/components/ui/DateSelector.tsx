"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function DateSelector({
  currentDate,
  today,
}: {
  currentDate: string;
  today: string;
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
        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
      >
        <Icon icon="solar:arrow-left-linear" className="text-xl" />
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-bold text-foreground">
          {isToday ? "Today" : displayDate}
        </p>
        {!isToday && (
          <button
            onClick={goToToday}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors"
          >
            Back to today
          </button>
        )}
      </div>

      <button
        onClick={() => goToDate(1)}
        disabled={isFuture}
        className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform ${
          isFuture
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-foreground"
        }`}
      >
        <Icon icon="solar:arrow-right-linear" className="text-xl" />
      </button>
    </div>
  );
}