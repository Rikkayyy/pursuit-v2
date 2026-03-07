import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MilestoneList from "@/components/features/goals/MilestoneList";
import TaskList from "@/components/features/goals/TaskList";

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/goals" className="text-sm text-gray-700 hover:text-black">
            ← Back
          </Link>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 uppercase">
            {goal.status}
          </span>
        </div>

        {/* Goal Info */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <h1 className="text-2xl font-bold">{goal.title}</h1>
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-gray-700">{goal.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Milestones
            </p>
            <p className="mt-1 text-xl font-bold">
              {completedMilestones} <span className="text-sm font-normal text-gray-600">/ {milestones.length}</span>
            </p>
            <p className="text-xs text-gray-600">
              {milestones.length - completedMilestones} remaining
            </p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Progress
            </p>
            <p className="mt-1 text-xl font-bold">
              {milestonePercent}<span className="text-sm font-normal text-gray-600">%</span>
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${milestonePercent}%`, backgroundColor: goal.color }}
              />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Milestones</h2>
            <span className="text-xs text-gray-600">{milestonePercent}%</span>
          </div>
          <MilestoneList milestones={milestones} goalColor={goal.color} />
        </div>

        {/* Tasks / Systems */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Systems</h2>
            <span className="text-xs text-gray-600">{tasks.length} tasks</span>
          </div>
          <TaskList tasks={tasks} />
        </div>
      </div>
    </div>
  );
}