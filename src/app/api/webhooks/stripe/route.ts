import { createClient as createAdminClient } from "@supabase/supabase-js";
import { upsertSubscription } from "@/lib/api/subscriptions";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function syncSubscription(supabase: ReturnType<typeof adminClient>, userId: string, subscription: Stripe.Subscription) {
  await upsertSubscription(supabase, {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = adminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(supabase, userId, subscription);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (data?.user_id) {
        await syncSubscription(supabase, data.user_id, subscription);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription;
      if (!subscriptionId) break;

      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId as string)
        .maybeSingle();

      if (data?.user_id) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        await syncSubscription(supabase, data.user_id, subscription);
        console.warn(`Payment failed for user ${data.user_id}, subscription status is now ${subscription.status}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
