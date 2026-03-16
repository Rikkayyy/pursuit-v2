import { SupabaseClient } from "@supabase/supabase-js";

export async function createMilestone(
  supabase: SupabaseClient,
  data: {
    goal_id: string;
    title: string;
    sort_order: number;
  }
) {
  const { error } = await supabase.from("milestones").insert(data);
  if (error) throw error;
}

export async function createMilestones(
  supabase: SupabaseClient,
  milestones: {
    goal_id: string;
    title: string;
    sort_order: number;
  }[]
) {
  if (milestones.length === 0) return;
  const { error } = await supabase.from("milestones").insert(milestones);
  if (error) throw error;
}

export async function updateMilestone(
  supabase: SupabaseClient,
  milestoneId: string,
  data: {
    title?: string;
    is_completed?: boolean;
  }
) {
  const { error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", milestoneId);

  if (error) throw error;
}

export async function toggleMilestone(supabase: SupabaseClient, milestoneId: string, currentState: boolean) {
  const { error } = await supabase
    .from("milestones")
    .update({ is_completed: !currentState })
    .eq("id", milestoneId);

  if (error) throw error;
}

export async function deleteMilestone(supabase: SupabaseClient, milestoneId: string) {
  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) throw error;
}