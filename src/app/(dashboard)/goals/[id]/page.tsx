import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoalDetailClient from "@/components/features/goals/GoalDetailClient";

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

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-primary/20">
      <GoalDetailClient goal={goal} milestones={milestones} tasks={tasks} />
    </div>
  );
}