import { SupabaseClient } from "@supabase/supabase-js";

export async function getSubscriptionStatus(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.subscription_status ?? "none";
}

export async function isSubscriptionActive(supabase: SupabaseClient, userId: string) {
  const status = await getSubscriptionStatus(supabase, userId);
  return status === "active" || status === "trialing";
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    subscription_status: string;
    current_period_end?: string | null;
  }
) {
  const { error } = await supabase
    .from("subscriptions")
    .upsert(data, { onConflict: "user_id" });

  if (error) throw error;
}
