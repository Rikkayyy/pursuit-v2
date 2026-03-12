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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-800">
              {greeting} · {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl font-bold">
              {completedCount === totalCount && totalCount > 0
                ? isToday ? "All done today! 🎉" : "All done that day! 🎉"
                : "You're in motion"}
            </h1>
            <p className="text-sm text-gray-800 mt-0.5">
              {completedCount === 0 && totalCount > 0
                ? "Let's get started — that counts."
                : completedCount === totalCount && totalCount > 0
                ? "Every task completed. Great work."
                : `${completedCount} of ${totalCount} done — keep going.`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{completedCount}</span>
            <span className="text-gray-700">/{totalCount}</span>
            <a href="/settings" className="text-xs text-gray-700 hover:text-black">⚙️</a>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mt-4">
          <DateSelector currentDate={selectedDate} today={today} />
        </div>

        {/* 7-Day Activity */}
        {totalCount > 0 && (
          <div className="mt-6 rounded-xl bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Past 7 Days</p>
              {(() => {
                const totalCompleted = dailyActivity.reduce((sum, d) => sum + d.count, 0);
                const totalExpected = dailyActivity.reduce((sum, d) => sum + d.total, 0);
                const rate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
                return (
                  <span className="text-xs font-bold text-black">{rate}% hit rate</span>
                );
              })()}
            </div>
            <div className="flex items-center justify-between gap-2">
              {dailyActivity.map((day) => {
                const ratio = day.total > 0 ? day.count / day.total : 0;
                const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: ratio === 0
                          ? "#f3f4f6"
                          : ratio < 0.5
                          ? "#fecaca"
                          : ratio < 1
                          ? "#fca5a5"
                          : "#ef4444",
                        color: ratio > 0 ? "white" : "#4b5563",
                      }}
                    >
                      {ratio === 1 ? "✓" : ratio > 0 ? Math.round(ratio * 100) : ""}
                    </div>
                    <span className={`text-[10px] font-bold ${day.date === today ? "text-black" : "text-gray-600"}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Motivational Nudge */}
        {totalCount > 0 && completedCount < totalCount && totalCount - completedCount <= 2 && (
          <div className="mt-4 rounded-xl bg-black text-white p-3 text-center text-sm font-medium">
            ✨ {totalCount - completedCount === 1 ? "One more" : "Two more"} for a &quot;Full Day&quot;!
          </div>
        )}

        {totalCount > 0 && completedCount === totalCount && (
          <div className="mt-4 rounded-xl bg-green-50 border border-green-200 text-green-700 p-3 text-center text-sm font-medium">
            🎉 Full Day! You completed everything.
          </div>
        )}

        {/* Task List */}
        {totalCount === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-800">No tasks scheduled for today.</p>
            <a
              href="/goals/new"
              className="mt-2 inline-block text-sm font-medium text-black hover:underline"
            >
              Create a goal to get started
            </a>
          </div>
        ) : (
          <div className="mt-8">
            <DailyTaskList tasks={todaysTasks} today={selectedDate} goalStats={goalStats} />
            {/* Anytime Tasks */}
            {anytimeTasks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Anytime
                </h2>
                <div className="space-y-2">
                  {anytimeTasks.map((item) => (
                    <AnytimeTask key={item.task.id} item={item} today={selectedDate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}