import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaskStreaks } from "@/lib/streaks";
import { cookies } from "next/headers";
import DailyTaskList from "@/components/features/daily/DailyTaskList";
import { getDailyCompletions } from "@/lib/weekly-stats";
import { getWeeklyHitRate } from "@/lib/weekly-stats";
import AnytimeTask from "@/components/features/daily/AnytimeTask";
import DateSelector from "@/components/ui/DateSelector";
import { Icon } from "@iconify/react";

export default async function DailyView({
    searchParams,
  }: {
    searchParams: Promise<{ date?: string }>;
  }) {
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const timezone = cookieStore.get("user_timezone")?.value || "America/Chicago";
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: timezone });

  const { date: dateParam } = await searchParams;
  const selectedDate = dateParam || today;
  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const isToday = selectedDate === today;

  // Get all active goals with their tasks and today's logs
  const { data: goals } = await supabase
    .from("goals")
    .select(`
      id,
      title,
      color,
      tasks (
        id,
        title,
        type,
        frequency,
        scheduled_days,
        due_date,
        goal_id
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  // Get today's task logs
  const { data: todayLogs } = await supabase
    .from("task_logs")
    .select("task_id")
    .eq("user_id", user.id)
    .eq("date", selectedDate);

  const completedTaskIds = new Set(todayLogs?.map((log) => log.task_id) || []);

  // Get streaks for recurring tasks — add this block
  const allRecurringTaskIds: string[] = [];
  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "recurring") {
        allRecurringTaskIds.push(task.id);
      }
    });
  });
  const streaks = await getTaskStreaks(supabase, allRecurringTaskIds, timezone);

  // Get 7-day activity for all tasks
  const allTaskIds: string[] = [];
  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "recurring") {
        allTaskIds.push(task.id);
      }
    });
  });
  const dailyActivity = await getDailyCompletions(supabase, allTaskIds, timezone);

  // Calculate weekly hit rate per goal
  const goalStats: Record<string, { rate: number }> = {};
  for (const goal of goals || []) {
    if (goal.tasks && goal.tasks.length > 0) {
      const stats = await getWeeklyHitRate(supabase, goal.tasks, timezone);
      goalStats[goal.id] = { rate: stats.rate };
    }
  }

  // Filter tasks that are due today
  const todaysTasks: {
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
  }[] = [];

  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      let isDueToday = false;

      if (task.type === "recurring") {
        if (task.frequency === "daily") {
          isDueToday = true;
        } else if (task.frequency === "weekly") {
          isDueToday = dayOfWeek === 1; // Mondays
        } else if (task.frequency === "specific_days" && task.scheduled_days) {
          isDueToday = task.scheduled_days.includes(dayOfWeek);
        }
      } else if (task.type === "one_time") {
        isDueToday = task.due_date === selectedDate;
      }

      if (isDueToday) {
        todaysTasks.push({
          task,
          goalTitle: goal.title,
          goalColor: goal.color,
          isCompleted: completedTaskIds.has(task.id),
          streak: streaks[task.id] || 0,
        });
      }
    });
  });

  // Collect one-time tasks with no due date
  const anytimeTasks: {
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
  }[] = [];

  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "one_time" && !task.due_date) {
        anytimeTasks.push({
          task,
          goalTitle: goal.title,
          goalColor: goal.color,
          isCompleted: completedTaskIds.has(task.id),
        });
      }
    });
  });

  const completedCount = todaysTasks.filter((t) => t.isCompleted).length;
  const totalCount = todaysTasks.length;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20">
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
              <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full scale-110 animate-pulse" />
              <svg className="w-20 h-20 transform -rotate-90 relative z-10">
                <circle
                  r={34}
                  cx={40}
                  cy={40}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-secondary"
                  strokeWidth={6}
                />
                <circle
                  r={34}
                  cx={40}
                  cy={40}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-primary drop-shadow-[0_0_8px_rgba(255,0,85,0.6)] transition-all duration-1000"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={213.6}
                  strokeDashoffset={totalCount > 0 ? 213.6 - (completedCount / totalCount) * 213.6 : 213.6}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                <div className="flex items-baseline gap-0.5 relative z-20">
                  <span className="text-2xl font-heading font-black text-foreground">{completedCount}</span>
                  <span className="text-sm font-bold text-muted-foreground/60">/{totalCount}</span>
                </div>
                <Icon
                  icon="solar:bolt-circle-bold"
                  className="text-primary text-[10px] mt-0.5 opacity-80"
                />
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
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Past 7 Days
              </h3>
              {(() => {
                const totalCompleted = dailyActivity.reduce((sum, d) => sum + d.count, 0);
                const totalExpected = dailyActivity.reduce((sum, d) => sum + d.total, 0);
                const rate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
                return (
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                    {rate}% hit rate
                  </span>
                );
              })()}
            </div>
            <div className="flex justify-between items-end gap-1.5 h-14 pt-2">
              {dailyActivity.map((day) => {
                const ratio = day.total > 0 ? day.count / day.total : 0;
                const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
                const isCurrentDay = day.date === selectedDate;
                const heightPx = day.isFuture ? 4 : ratio === 0 ? 10 : Math.max(20, Math.round(ratio * 48));
                return (
                  <div key={day.date} className="flex-1 group flex flex-col items-center">
                    <div className="h-12 flex items-end w-full justify-center">
                      <div
                        className="w-full max-w-[14px] rounded-lg transition-all group-hover:scale-110"
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
                    <span className={`text-[10px] font-bold mt-1.5 ${
                      isCurrentDay ? "text-primary underline underline-offset-2" : "text-muted-foreground"
                    }`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
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
            <DailyTaskList tasks={todaysTasks} today={selectedDate} goalStats={goalStats} />
            {anytimeTasks.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Anytime
                </h3>
                <div className="space-y-3">
                  {anytimeTasks.map((item) => (
                    <AnytimeTask key={item.task.id} item={item} today={selectedDate} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

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
        <div className="px-6 mt-6">
          <div className="bg-chart-3/10 border border-chart-3/20 text-chart-3 p-3 rounded-2xl text-center text-sm font-bold">
            🎉 Full Day! You completed everything.
          </div>
        </div>
      )}
    </div>
  );
}