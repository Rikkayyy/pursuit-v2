import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";

export async function POST() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            //Safe to ignore — src/proxy.ts refreshes the session cookie on every request.
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Cancel any live Stripe subscription first. The subscriptions row cascades
  // away with the auth user, so if we skipped this the user would keep being
  // billed with no way for the app to find or cancel the subscription.
  const { data: subscription } = await adminClient
    .from("subscriptions")
    .select("stripe_subscription_id, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    subscription?.stripe_subscription_id &&
    !["canceled", "incomplete_expired", "none"].includes(subscription.subscription_status)
  ) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (err) {
      console.error("Failed to cancel subscription during account deletion:", err);
      return NextResponse.json(
        { error: "Couldn't cancel your subscription. Please try again or contact support." },
        { status: 500 }
      );
    }
  }

  // Delete user's goals (cascades to milestones, tasks, task_logs)
  await supabase.from("goals").delete().eq("user_id", user.id);

  // Delete the auth user — requires service role key

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}