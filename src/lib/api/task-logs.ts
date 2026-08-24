import { SupabaseClient } from "@supabase/supabase-js";

export async function getLogsForDate(supabase: SupabaseClient, userId: string, date: string) {
  const { data, error } = await supabase
    .from("task_logs")
    .select("task_id")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) throw error;
  return data;
}

export async function logTask(supabase: SupabaseClient, taskId: string, userId: string, date: string) {
  const { error } = await supabase.from("task_logs").insert({
    task_id: taskId,
    user_id: userId,
    date,
  });

  if (error) throw error;
}

export async function unlogTask(supabase: SupabaseClient, taskId: string, date: string) {
  const { error } = await supabase
    .from("task_logs")
    .delete()
    .eq("task_id", taskId)
    .eq("date", date);

  if (error) throw error;
}