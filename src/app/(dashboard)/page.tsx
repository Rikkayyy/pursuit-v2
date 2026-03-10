import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTaskStreaks } from "@/lib/streaks";
import { getDailyCompletions, getWeeklyHitRate } from "@/lib/weekly-stats";
import DateSelector from "@/components/ui/DateSelector";
import DailyTaskList from "@/components/features/daily/DailyTaskList";
import AnytimeTask from "@/components/features/daily/AnytimeTask";

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const { data: goals } = await supabase
    .from("goals")
    .select(`
      id, title, color,
      tasks (id, title, type, frequency, scheduled_days, due_date, goal_id)
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: todayLogs } = await supabase
    .from("task_logs")
    .select("task_id")
    .eq("user_id", user.id)
    .eq("date", selectedDate);

  const completedTaskIds = new Set(todayLogs?.map((log) => log.task_id) || []);

  const allRecurringTaskIds: string[] = [];
  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "recurring") {
        allRecurringTaskIds.push(task.id);
      }
    });
  });
  const streaks = await getTaskStreaks(supabase, allRecurringTaskIds, timezone);

  const allTaskIds: string[] = [];
  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "recurring") {
        allTaskIds.push(task.id);
      }
    });
  });
  const dailyActivity = await getDailyCompletions(supabase, allTaskIds, timezone);

  const goalStats: Record<string, { rate: number }> = {};
  for (const goal of goals || []) {
    if (goal.tasks && goal.tasks.length > 0) {
      const stats = await getWeeklyHitRate(supabase, goal.tasks, timezone);
      goalStats[goal.id] = { rate: stats.rate };
    }
  }

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
          isDueToday = dayOfWeek === 1;
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
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // SVG circle math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      {/* Header */}
      <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              {hour < 12 ? "☀️" : hour < 18 ? "🌤" : "🌙"} {greeting}
            </h2>
            <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {completedCount === totalCount && totalCount > 0
                ? isToday ? "All done! 🎉" : "Perfect day!"
                : "You're in motion"}
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              {completedCount === 0 && totalCount > 0
                ? isToday ? "Let's get started — that counts." : "No tasks were logged."
                : completedCount === totalCount && totalCount > 0
                ? "Every task completed. Great work."
                : `${completedCount} of ${totalCount} done${isToday ? " — keep going." : "."}`}
            </p>
          </div>

          {/* Progress Ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full scale-110" />
            <svg className="w-20 h-20 transform -rotate-90 relative z-10">
              <circle
                r={radius}
                cx="40"
                cy="40"
                fill="transparent"
                stroke="currentColor"
                className="text-secondary"
                strokeWidth="6"
              />
              <circle
                r={radius}
                cx="40"
                cy="40"
                fill="transparent"
                stroke="currentColor"
                className="text-primary drop-shadow-[0_0_8px_rgba(255,0,85,0.6)]"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
              <div className="flex items-baseline gap-0.5 relative z-20">
                <span className="text-2xl font-heading font-black text-foreground">{completedCount}</span>
                <span className="text-sm font-bold text-muted-foreground/60">/{totalCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mt-4 relative z-10">
          <DateSelector currentDate={selectedDate} today={today} />
        </div>

        {/* Settings */}
        <a href="/settings" className="absolute top-12 right-6 text-muted-foreground hover:text-foreground transition-colors z-10">
          ⚙️
        </a>
      </header>

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
            <div className="flex justify-between items-end gap-1.5">
              {dailyActivity.map((day) => {
                const ratio = day.total > 0 ? day.count / day.total : 0;
                const dayLabel = new Date(day.date + "T12:00:00")
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .charAt(0);
                const isSelected = day.date === selectedDate;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={`h-8 w-full rounded-full transition-all ${
                        ratio === 0
                          ? "bg-secondary"
                          : ratio < 0.5
                          ? "bg-primary/30"
                          : ratio < 1
                          ? "bg-primary/60"
                          : "bg-primary"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
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
          <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-xl text-xs font-bold flex items-center justify-center gap-2">
            ✨ {totalCount - completedCount === 1 ? "One more" : "Two more"} for a &quot;Full Day&quot;!
          </div>
        </div>
      )}

      {totalCount > 0 && completedCount === totalCount && (
        <div className="px-6 mb-6">
          <div className="bg-accent border border-accent-foreground/10 text-accent-foreground rounded-2xl p-3 text-center text-sm font-bold">
            🎉 Full Day! You completed everything.
          </div>
        </div>
      )}

      {/* Task List */}
      <main className="px-6 space-y-8">
        {totalCount === 0 && anytimeTasks.length === 0 ? (
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
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Anytime
                </h2>
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
    </>
  );
}