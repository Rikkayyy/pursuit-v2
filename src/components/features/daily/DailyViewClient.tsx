"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import DailyTaskList from "@/components/features/daily/DailyTaskList";
import AnytimeTask from "@/components/features/daily/AnytimeTask";
import DateSelector from "@/components/ui/DateSelector";

type DailyTask = {
  task: {
    id: string;
    title: string;
    type: string;
    frequency: string | null;
    scheduled_days: number[] | null;
    due_date: string | null;
    goal_id: string;
  };
  goalTitle: string;
  goalColor: string;
  isCompleted: boolean;
  streak: number;
};

type AnytimeTaskType = {
  task: {
    id: string;
    title: string;
    type: string;
    frequency: string | null;
    scheduled_days: number[] | null;
    due_date: string | null;
    goal_id: string;
  };
  goalTitle: string;
  goalColor: string;
  isCompleted: boolean;
};

type DailyActivity = {
  date: string;
  count: number;
  total: number;
  isFuture: boolean;
};

export default function DailyViewClient({
  todaysTasks,
  anytimeTasks,
  selectedDate,
  today,
  isToday,
  greeting,
  goalStats,
  dailyActivity: initialDailyActivity,
}: {
  todaysTasks: DailyTask[];
  anytimeTasks: AnytimeTaskType[];
  selectedDate: string;
  today: string;
  isToday: boolean;
  greeting: string;
  goalStats: Record<string, { rate: number }>;
  dailyActivity: DailyActivity[];
}) {
  const [completionOverrides, setCompletionOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCompletionOverrides({});
  }, [selectedDate]);

  const getEffectiveCompleted = (taskId: string, serverCompleted: boolean) => {
    return completionOverrides[taskId] !== undefined
      ? completionOverrides[taskId]
      : serverCompleted;
  };

  const onTaskToggle = (taskId: string, newState: boolean) => {
    setCompletionOverrides((prev) => ({ ...prev, [taskId]: newState }));
  };

  // Calculate local completion count
  const completedCount = todaysTasks.filter((t) =>
    getEffectiveCompleted(t.task.id, t.isCompleted)
  ).length;
  const totalCount = todaysTasks.length;

  // Calculate local daily activity (update today's count)
  const dailyActivity = initialDailyActivity.map((day) => {
    if (day.date === selectedDate) {
      const localCount = todaysTasks.filter((t) =>
        getEffectiveCompleted(t.task.id, t.isCompleted)
      ).length;
      return { ...day, count: localCount };
    }
    return day;
  });

  // Local hit rate
  const totalCompleted = dailyActivity.reduce((sum, d) => sum + d.count, 0);
  const totalExpected = dailyActivity.reduce((sum, d) => sum + d.total, 0);
  const hitRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  return (
    <>
      {/* Header */}
      <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Icon icon="solar:sun-2-bold" className="text-chart-2" />
              {greeting}
            </h2>
            <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {completedCount === totalCount && totalCount > 0
                ? isToday ? "All done today!" : "All done that day!"
                : "You're in motion"}
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              {completedCount === 0 && totalCount > 0
                ? "You showed up today — that counts."
                : completedCount === totalCount && totalCount > 0
                ? "Every task completed. Great work."
                : `${completedCount} of ${totalCount} done${isToday ? " — keep going." : "."}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {completedCount > 0 && (
                <div className="absolute inset-0 rounded-full scale-110" style={{ backgroundColor: "rgba(255, 0, 85, 0.15)", filter: "blur(16px)" }} />
              )}
              <svg className="w-20 h-20 transform -rotate-90 relative z-10">
                <circle
                  r={34}
                  cx={40}
                  cy={40}
                  fill="transparent"
                  stroke="#f3f4f6"
                  strokeWidth={6}
                />
                <circle
                  r={34}
                  cx={40}
                  cy={40}
                  fill="transparent"
                  stroke="#ff0055"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={213.6}
                  strokeDashoffset={totalCount > 0 ? 213.6 - (completedCount / totalCount) * 213.6 : 213.6}
                  style={{
                    filter: completedCount > 0 ? "drop-shadow(0 0 8px rgba(255, 0, 85, 0.6))" : "none",
                    transition: "stroke-dashoffset 0.5s ease",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                <div className="flex items-baseline gap-0.5 relative z-20">
                  <span className="text-2xl font-heading font-black text-foreground">{completedCount}</span>
                  <span className="text-sm font-bold text-muted-foreground/60">/{totalCount}</span>
                </div>
                {completedCount > 0 && (
                  <Icon
                    icon="solar:bolt-circle-bold"
                    style={{ color: "#ff0055", fontSize: "10px", marginTop: "2px", opacity: 0.8 }}
                  />
                )}
              </div>
            </div>
            <a href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon="solar:settings-linear" className="text-xl" />
            </a>
          </div>
        </div>
      </header>

      {/* Date Selector */}
      <div className="px-6 mb-6">
        <DateSelector currentDate={selectedDate} today={today} />
      </div>

      {/* 7-Day Activity */}
      {totalCount > 0 && (
        <section className="px-6 mb-8">
          <div className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Past 7 Days
              </h3>
              <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                {hitRate}% hit rate
              </span>
            </div>
            <div className="flex justify-between items-end gap-2 h-16 pt-2">
              {dailyActivity.map((day) => {
                const ratio = day.total > 0 ? day.count / day.total : 0;
                const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
                const isCurrentDay = day.date === selectedDate;
                const heightPx = day.isFuture ? 4 : ratio === 0 ? 10 : Math.max(16, Math.round(ratio * 48));
                return (
                  <div key={day.date} className="flex-1 group flex flex-col items-center">
                    <div className="h-14 flex items-end w-full justify-center">
                      <div
                        className="w-11 rounded-full transition-all duration-300 group-hover:scale-110"
                        style={{
                          height: `${heightPx}px`,
                          backgroundColor: day.isFuture
                            ? "#e5e7eb"
                            : ratio === 0
                            ? "#d1d5db"
                            : "#ff0055",
                          opacity: day.isFuture ? 0.3 : ratio === 0 ? 1 : 0.3 + ratio * 0.7,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-bold mt-1.5"
                      style={{
                        color: isCurrentDay ? "#ff0055" : "#9ca3af",
                        textDecoration: isCurrentDay ? "underline" : "none",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Motivational Nudge */}
      {totalCount > 0 && completedCount < totalCount && totalCount - completedCount <= 2 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs text-center z-40">
          <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-xl text-xs font-bold animate-bounce flex items-center justify-center gap-2">
            <Icon icon="fluent-emoji:sparkles" className="text-base" />
            {totalCount - completedCount === 1 ? "One more" : "Two more"} for a &quot;Full Day&quot;!
          </div>
        </div>
      )}

      {totalCount > 0 && completedCount === totalCount && (
        <div className="px-6 mb-6">
          <div className="bg-chart-3/10 border border-chart-3/20 text-chart-3 p-3 rounded-2xl text-center text-sm font-bold">
            🎉 Full Day! You completed everything.
          </div>
        </div>
      )}

      {/* Task List */}
      <main className="px-6 space-y-8">
        {totalCount === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">No tasks scheduled for today.</p>
            <a
              href="/goals/new"
              className="mt-2 inline-block text-sm font-bold text-primary hover:underline"
            >
              Create a goal to get started
            </a>
          </div>
        ) : (
          <>
            <DailyTaskList
              tasks={todaysTasks}
              today={selectedDate}
              goalStats={goalStats}
              onTaskToggle={onTaskToggle}
            />
            {anytimeTasks.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Anytime
                </h3>
                <div className="space-y-3">
                  {anytimeTasks.map((item) => (
                    <AnytimeTask key={item.task.id} item={item} today={selectedDate} onToggle={onTaskToggle} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}