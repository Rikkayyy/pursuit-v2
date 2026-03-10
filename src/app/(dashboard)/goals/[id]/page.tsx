import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import GoalActions from "@/components/features/goals/GoalActions";
import MilestoneList from "@/components/features/goals/MilestoneList";
import TaskList from "@/components/features/goals/TaskList";
import AddMilestone from "@/components/features/goals/AddMilestone";
import AddTask from "@/components/features/goals/AddTask";

export default async function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: goal } = await supabase
    .from("goals")
    .select(`
      *,
      milestones (*, id, title, is_completed, due_date, sort_order),
      tasks (*, id, title, type, frequency, scheduled_days, due_date, sort_order)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) {
    notFound();
  }

  const milestones = goal.milestones?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || [];
  const tasks = goal.tasks?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || [];
  const completedMilestones = milestones.filter((m: { is_completed: boolean }) => m.is_completed).length;
  const milestonePercent = milestones.length > 0
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  return (
    <>
      <div className="h-10" />

      {/* Header */}
      <header className="px-6 flex items-center justify-between mb-8">
        <Link
          href="/goals"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          ←
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="px-4 py-2 rounded-full font-bold text-xs"
            style={{
              backgroundColor: goal.color + "15",
              color: goal.color,
            }}
          >
            {goal.status.toUpperCase()}
          </span>
          <GoalActions goal={goal} />
        </div>
      </header>

      <main className="px-6 space-y-10">
        {/* Goal Info */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: goal.color }}
            >
              🎯
            </div>
            <h1 className="text-3xl font-heading font-extrabold">{goal.title}</h1>
          </div>
          {goal.description && (
            <p className="text-muted-foreground text-base leading-relaxed">{goal.description}</p>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: goal.color + "15",
                  color: goal.color,
                }}
              >
                🏅
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Milestones
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-heading font-bold">{completedMilestones}</span>
              <span className="text-muted-foreground text-lg">/ {milestones.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {milestones.length - completedMilestones} remaining
            </p>
          </div>
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center">
                📊
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-heading font-bold">{milestonePercent}</span>
              <span className="text-muted-foreground text-lg">%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${milestonePercent}%`,
                  backgroundColor: goal.color,
                }}
              />
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              Milestones
              <span className="bg-secondary px-2 py-0.5 rounded text-xs text-muted-foreground font-bold">
                {milestonePercent}%
              </span>
            </h2>
          </div>
          <MilestoneList milestones={milestones} goalColor={goal.color} />
          <AddMilestone goalId={goal.id} nextOrder={milestones.length} />
        </section>

        {/* Systems */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">Systems</h2>
          </div>
          <TaskList tasks={tasks} goalColor={goal.color} />
          <AddTask goalId={goal.id} nextOrder={tasks.length} />
        </section>
      </main>
    </>
  );
}