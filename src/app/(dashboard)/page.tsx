import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaskStreaks } from "@/lib/streaks";
import { cookies } from "next/headers";
import DailyTaskList from "@/components/features/daily/DailyTaskList";
import { getDailyCompletions } from "@/lib/weekly-stats";
import { getWeeklyHitRate } from "@/lib/weekly-stats";
import AnytimeTask from "@/components/features/daily/AnytimeTask";
import DateSelector from "@/components/ui/DateSelector";

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
      {/* Header */}
      <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              {greeting}
            </h2>
            <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {completedCount === totalCount && totalCount > 0
                ? isToday ? "All done today! 🎉" : "All done that day! 🎉"
                : "You're in motion"}
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              {completedCount === 0 && totalCount > 0
                ? "Let's get started — that counts."
                : completedCount === totalCount && totalCount > 0
                ? "Every task completed. Great work."
                : `${completedCount} of ${totalCount} done${isToday ? " — keep going." : "."}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  r={28}
                  cx={32}
                  cy={32}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-secondary"
                  strokeWidth={5}
                />
                <circle
                  r={28}
                  cx={32}
                  cy={32}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-primary transition-all duration-1000"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={175.9}
                  strokeDashoffset={totalCount > 0 ? 175.9 - (completedCount / totalCount) * 175.9 : 175.9}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-heading font-black text-foreground">{completedCount}</span>
                  <span className="text-xs font-bold text-muted-foreground/60">/{totalCount}</span>
                </div>
              </div>
            </div>
            <a href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
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
            <div className="flex justify-between items-end gap-1.5">
              {dailyActivity.map((day) => {
                const ratio = day.total > 0 ? day.count / day.total : 0;
                const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
                const isCurrentDay = day.date === selectedDate;
                const height = ratio === 0 ? "h-3" : ratio < 0.25 ? "h-4" : ratio < 0.5 ? "h-6" : ratio < 0.75 ? "h-8" : ratio < 1 ? "h-10" : "h-12";
                return (
                  <div key={day.date} className="flex-1 group relative flex flex-col items-center">
                    <div className="h-12 flex items-end w-full justify-center">
                      <div
                        className={`w-full max-w-[12px] rounded-full transition-all group-hover:scale-110 ${height} ${
                          ratio === 0
                            ? "bg-secondary"
                            : ratio < 0.5
                            ? "bg-primary/30 border border-primary/20"
                            : ratio < 1
                            ? "bg-primary/60"
                            : "bg-primary shadow-[0_0_10px_rgba(255,0,85,0.3)]"
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${
                      isCurrentDay ? "text-primary" : "text-muted-foreground"
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
            <DailyTaskList tasks={todaysTasks} today={selectedDate} goalStats={goalStats} />
            {/* Anytime Tasks */}
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
    </div>
  );
}