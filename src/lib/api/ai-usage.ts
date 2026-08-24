import { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_AI_GENERATION_LIMIT = 15;

// Must be called with a service-role client — the underlying table has no
// RLS policies for the authenticated role, by design (see migration).
export async function incrementAndCheckAiUsage(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc("increment_ai_generation_count", {
    p_user_id: userId,
    p_date: today,
  });

  if (error) throw error;

  const count = data as number;
  return { allowed: count <= DAILY_AI_GENERATION_LIMIT, count };
}
