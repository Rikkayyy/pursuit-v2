"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCalendarData } from "@/hooks/useCalendarData";
import CalendarHeader from "./CalendarHeader";
import MonthNav from "./MonthNav";
import CalendarGrid from "./CalendarGrid";

export default function CalendarModal({
  open,
  onClose,
  selectedDate,
  today,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  today: string;
}) {
  const router = useRouter();
  const [viewYear, setViewYear] = useState(() => Number(selectedDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(selectedDate.slice(5, 7)) - 1);
  const { loading, days, streaks } = useCalendarData(open, viewYear, viewMonth, today);

  const isCurrentMonth =
    viewYear === Number(today.slice(0, 4)) && viewMonth === Number(today.slice(5, 7)) - 1;

  useEffect(() => {
    if (!open) return;
    setViewYear(Number(selectedDate.slice(0, 4)));
    setViewMonth(Number(selectedDate.slice(5, 7)) - 1);
  }, [open, selectedDate]);

  if (!open) return null;

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (dateStr: string) => {
    if (dateStr > today) return;
    if (dateStr !== selectedDate) router.push(`/?date=${dateStr}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2rem] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
        <CalendarHeader selectedDate={selectedDate} streaks={streaks} onClose={onClose} />

        <div className="px-4">
          <MonthNav
            viewYear={viewYear}
            viewMonth={viewMonth}
            canGoNext={!isCurrentMonth}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
          />
          <CalendarGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            days={days}
            loading={loading}
            selectedDate={selectedDate}
            today={today}
            onSelect={selectDay}
          />
        </div>
      </div>
    </>
  );
}
