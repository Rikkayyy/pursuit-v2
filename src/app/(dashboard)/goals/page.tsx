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
    <>
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground">My Goals</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {activeCount} Active • {totalRemainingMilestones} Milestones left
          </p>
        </div>
        <Link
          href="/goals/new"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-all shadow-md active:scale-95"
        >
          <span className="text-xl">+</span>
        </Link>
      </header>

      <main className="px-6 py-6 space-y-4">
        <GoalFilters
          current={currentFilter}
          counts={{ active: activeCount, completed: completedCount, archived: archivedCount }}
        />

        {filteredGoals.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              {currentFilter === "active"
                ? "No active goals."
                : currentFilter === "completed"
                ? "No completed goals yet."
                : "No archived goals."}
            </p>
            {currentFilter === "active" && (
              <Link
                href="/goals/new"
                className="mt-2 inline-block text-sm font-bold text-primary hover:underline"
              >
                Create your first goal
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {goalsWithStats.map((goal) =>
              goal.status === "archived" ? (
                <div
                  key={goal.id}
                  className="bg-muted/30 border border-border/40 rounded-3xl p-5 shadow-none flex items-center gap-4 opacity-60"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground text-xl">
                    📦
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-heading font-bold text-muted-foreground">{goal.title}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      ARCHIVED
                    </p>
                  </div>
                </div>
              ) : (
                <GoalCard key={goal.id} goal={goal} weeklyStats={goal.weeklyStats} />
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}