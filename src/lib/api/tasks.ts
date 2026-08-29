import { SupabaseClient } from "@supabase/supabase-js";

export async function createTask(
  supabase: SupabaseClient,
  data: {
    goal_id: string;
    title: string;
    type: string;
    frequency?: string | null;
    scheduled_days?: number[] | null;
    sort_order: number;
  }
) {
  const { error } = await supabase.from("tasks").insert(data);
  if (error) throw error;
}

export async function createTasks(
  supabase: SupabaseClient,
  tasks: {
    goal_id: string;
    title: string;
    type: string;
    frequency?: string | null;
    scheduled_days?: number[] | null;
    sort_order: number;
  }[]
) {
  if (tasks.length === 0) return;
  const { error } = await supabase.from("tasks").insert(tasks);
  if (error) throw error;
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  data: {
    title?: string;
    type?: string;
    frequency?: string | null;
    scheduled_days?: number[] | null;
  }
) {
  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId);

  if (error) throw error;
}

export async function deleteTask(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
}