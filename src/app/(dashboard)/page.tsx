import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaskStreaks } from "@/lib/streaks";
import { cookies } from "next/headers";
import { getDailyCompletions } from "@/lib/weekly-stats";
import { getWeeklyHitRate } from "@/lib/weekly-stats";
import { getSafeTimezone } from "@/lib/util";
import DailyViewClient from "@/components/features/daily/DailyViewClient";
import { getWeekStart } from "@/lib/week";

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
  const timezone = getSafeTimezone(cookieStore.get("user_timezone")?.value);
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: timezone });

  const { date: dateParam } = await searchParams;
  const selectedDate = dateParam || today;
  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const weekStartOfSelectedDate = getWeekStart(selectedDate);
  const isToday = selectedDate === today;

  // === WAVE 1: Fetch independent data in parallel ===
  const [{ data: goals }, { data: relevantLogs }] = await Promise.all([
    supabase
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
      .eq("status", "active"),
    supabase
      .from("task_logs")
      .select("task_id, date")
      .eq("user_id", user.id)
      .in("date", [selectedDate, weekStartOfSelectedDate]), // Fetch logs for both selected date and week start
  ]);

  const completedTaskIds = new Set(
    relevantLogs?.filter((log) => log.date === selectedDate).map((log) => log.task_id) || []
  );

  const weeklyCompletedTaskIds = new Set(
    relevantLogs?.filter((log) => log.date === weekStartOfSelectedDate).map((log) => log.task_id) || []
  );

  // Collect task IDs for wave 2
    const allRecurringTasks: { id: string; frequency: string | null; scheduled_days: number[] | null }[] = [];
  goals?.forEach((goal) => {
    goal.tasks?.forEach((task) => {
      if (task.type === "recurring") {
        allRecurringTasks.push({
          id: task.id,
          frequency: task.frequency,
          scheduled_days: task.scheduled_days ?? null,
        });
      }
    });
  });

  // === WAVE 2: Fetch dependent data in parallel ===
  const [streaks, dailyActivity, ...goalStatsResults] = await Promise.all([
    getTaskStreaks(supabase, allRecurringTasks, timezone),
    getDailyCompletions(supabase, allRecurringTasks.map((t) => t.id), timezone),
    ...(goals || [])
      .filter((goal) => goal.tasks && goal.tasks.length > 0)
      .map((goal) => 
        getWeeklyHitRate(supabase, goal.tasks, timezone).then((stats) => ({
          goalId: goal.id,
          rate: stats.rate,
        }))
      ),
  ]);

  // Build goalStats from parallel results
  const goalStats: Record<string, { rate: number }> = {};
  goalStatsResults.forEach((result) => {
    goalStats[result.goalId] = { rate: result.rate };
  });

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
        if (task.frequency === "daily" || task.frequency === "weekly") {
          isDueToday = true;
        } else if (task.frequency === "specific_days") {
          isDueToday = task.scheduled_days?.includes(dayOfWeek) ?? false;
        }
      } else if (task.type === "one_time") {
        isDueToday = task.due_date === selectedDate;
      }

      if (isDueToday) {
        todaysTasks.push({
          task,
          goalTitle: goal.title,
          goalColor: goal.color,
          isCompleted: 
            task.frequency === "weekly" 
              ? weeklyCompletedTaskIds.has(task.id) 
              : completedTaskIds.has(task.id),
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
      <DailyViewClient
        todaysTasks={todaysTasks}
        anytimeTasks={anytimeTasks}
        selectedDate={selectedDate}
        today={today}
        isToday={isToday}
        greeting={greeting}
        goalStats={goalStats}
        dailyActivity={dailyActivity}
      />
    </div>    
  );
}