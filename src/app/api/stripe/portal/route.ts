import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/api/subscriptions";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscription(supabase, user.id);
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
