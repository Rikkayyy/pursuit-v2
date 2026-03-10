"use client";

import { useRouter } from "next/navigation";

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
        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors text-sm"
      >
        ←
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-medium">{isToday ? "Today" : displayDate}</p>
        {!isToday && (
          <button
            onClick={goToToday}
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
          >
            Back to today
          </button>
        )}
      </div>

      <button
        onClick={() => goToDate(1)}
        disabled={isFuture}
        className={`h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm transition-colors ${
          isFuture
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-200"
        }`}
      >
        →
      </button>
    </div>
  );
}