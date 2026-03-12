import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import GoalCard from "@/components/features/goals/GoalCard";
import GoalFilters from "@/components/features/goals/GoalFilters";
import { getWeeklyHitRate } from "@/lib/weekly-stats";

export default async function GoalsOverview({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const timezone = cookieStore.get("user_timezone")?.value || "America/Chicago";

  const { data: goals } = await supabase
    .from("goals")
    .select(`
      *,
      milestones (id, is_completed),
      tasks (id, type, frequency, scheduled_days)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const currentFilter = filter || "active";
  const filteredGoals = goals?.filter((g) => g.status === currentFilter) || [];

  const activeCount = goals?.filter((g) => g.status === "active").length || 0;
  const completedCount = goals?.filter((g) => g.status === "completed").length || 0;
  const archivedCount = goals?.filter((g) => g.status === "archived").length || 0;

  // Calculate weekly hit rate for each goal
  const goalsWithStats = await Promise.all(
    filteredGoals.map(async (goal) => {
      const weeklyStats = await getWeeklyHitRate(supabase, goal.tasks || [], timezone);
      return { ...goal, weeklyStats };
    })
  );

  const totalRemainingMilestones = goals
    ?.filter((g) => g.status === "active")
    .reduce(
      (sum, g) => sum + (g.milestones?.filter((m: { is_completed: boolean }) => !m.is_completed).length || 0), 0
    ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold ">My Goals</h1>
            <p className="text-sm text-gray-700">
              {activeCount} Active · {totalRemainingMilestones} Milestones left
            </p>
          </div>
          <Link
            href="/goals/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white text-lg hover:bg-gray-800"
          >
            +
          </Link>
        </div>

        <GoalFilters
          current={currentFilter}
          counts={{ active: activeCount, completed: completedCount, archived: archivedCount }}
        />

        {filteredGoals.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-700">
              {currentFilter === "active"
                ? "No active goals."
                : currentFilter === "completed"
                ? "No completed goals yet."
                : "No archived goals."}
            </p>
            {currentFilter === "active" && (
              <Link
                href="/goals/new"
                className="mt-2 inline-block text-sm font-medium text-black hover:underline"
              >
                Create your first goal
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {goalsWithStats.map((goal) => (
              <GoalCard key={goal.id} goal={goal} weeklyStats={goal.weeklyStats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}