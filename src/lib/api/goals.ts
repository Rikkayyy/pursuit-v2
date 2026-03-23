import { SupabaseClient } from "@supabase/supabase-js";

export async function getGoals(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select(`
      *,
      milestones (id, is_completed),
      tasks (id, type, frequency, scheduled_days)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getGoalWithDetails(supabase: SupabaseClient, goalId: string, userId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select(`
      *,
      milestones (*, id, title, is_completed, due_date, sort_order),
      tasks (*, id, title, type, frequency, scheduled_days, due_date, sort_order)
    `)
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveGoalsWithTasks(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
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
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;
  return data;
}

export async function createGoal(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    title: string;
    description?: string | null;
    color: string;
  }
) {
  const { data: goal, error } = await supabase
    .from("goals")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return goal;
}

export async function updateGoal(
  supabase: SupabaseClient,
  goalId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: string;
    color?: string;
  }
) {
  const { error } = await supabase
    .from("goals")
    .update(data)
    .eq("id", goalId);

  if (error) throw error;
}

export async function deleteGoal(supabase: SupabaseClient, goalId: string) {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId);

  if (error) throw error;
}