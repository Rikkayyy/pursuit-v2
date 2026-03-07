import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaskStreaks } from "@/lib/streaks";
import SignOutButton from "@/components/ui/SignOutButton";
import DailyTaskList from "@/components/features/daily/DailyTaskList";

export default async function DailyView() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay(); // 0 = Sunday

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
    .eq("date", today);

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
  const streaks = await getTaskStreaks(supabase, allRecurringTaskIds);

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
        isDueToday = task.due_date === today;
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
            <p className="text-sm text-gray-600">{greeting}</p>
            <h1 className="text-2xl font-bold">
              {completedCount === totalCount && totalCount > 0
                ? "All done today! 🎉"
                : "You're in motion"}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {completedCount === 0 && totalCount > 0
                ? "Let's get started — that counts."
                : completedCount === totalCount && totalCount > 0
                ? "Every task completed. Great work."
                : `${completedCount} of ${totalCount} done — keep going.`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{completedCount}</span>
            <span className="text-gray-600">/{totalCount}</span>
            <SignOutButton />
          </div>
        </div>

        {/* Task List */}
        {totalCount === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-600">No tasks scheduled for today.</p>
            <a
              href="/goals/new"
              className="mt-2 inline-block text-sm font-medium text-black hover:underline"
            >
              Create a goal to get started
            </a>
          </div>
        ) : (
          <div className="mt-8">
            <DailyTaskList tasks={todaysTasks} today={today} />
          </div>
        )}
      </div>
    </div>
  );
}