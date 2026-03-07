import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import GoalCard from "@/components/features/goals/GoalCard";

export default async function GoalsOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: goals } = await supabase
    .from("goals")
    .select(`
      *,
      milestones (id, is_completed),
      tasks (id, type, frequency)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeGoals = goals?.filter((g) => g.status === "active") || [];
  const totalMilestones = activeGoals.reduce(
    (sum, g) => sum + (g.milestones?.length || 0), 0
  );
  const remainingMilestones = activeGoals.reduce(
    (sum, g) => sum + (g.milestones?.filter((m: { is_completed: boolean }) => !m.is_completed).length || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Goals</h1>
            <p className="text-sm text-gray-500">
              {activeGoals.length} Active · {remainingMilestones} Milestones left
            </p>
          </div>
          <Link
            href="/goals/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white text-lg hover:bg-gray-800"
          >
            +
          </Link>
        </div>

        {activeGoals.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-500">No goals yet.</p>
            <Link
              href="/goals/new"
              className="mt-2 inline-block text-sm font-medium text-black hover:underline"
            >
              Create your first goal
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}