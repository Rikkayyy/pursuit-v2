import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@iconify/react";
import SignOutButton from "@/components/ui/SignOutButton";
import DeleteAccountButton from "@/components/ui/DeleteAccountButton";
import ManageSubscriptionButton from "@/components/ui/ManageSubscriptionButton";
import { getSubscription } from "@/lib/api/subscriptions";
import Link from "next/link";

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: goalCount } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: completionCount } = await supabase
    .from("task_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const subscription = await getSubscription(supabase, user.id);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/20">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          <Icon icon="solar:arrow-left-linear" className="text-xl" />
        </Link>
        <h1 className="text-2xl font-heading font-extrabold">Settings</h1>
      </header>

      <main className="px-6 space-y-6">
        {/* Profile */}
        <section className="bg-card rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: "#ff0055" }}
            >
              <Icon icon="solar:user-bold" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">{user.email}</h2>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-2xl p-4 text-center">
              <span className="text-2xl font-heading font-bold block">{goalCount || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goals</span>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 text-center">
              <span className="text-2xl font-heading font-bold block">{completionCount || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completions</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="bg-card rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            About
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="solar:info-circle-linear" className="text-muted-foreground" />
                <span className="text-sm font-medium">Version</span>
              </div>
              <span className="text-sm text-muted-foreground">0.1.0 (MVP)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="solar:compass-linear" className="text-muted-foreground" />
                <span className="text-sm font-medium">Method</span>
              </div>
              <span className="text-sm text-muted-foreground">GPS</span>
            </div>
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center gap-3">
                <Icon icon="solar:magic-stick-3-linear" className="text-muted-foreground" />
                <span className="text-sm font-medium">AI</span>
              </div>
              <span className="text-sm text-muted-foreground">Powered by Claude</span> */}
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-card rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Subscription
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block">
                {subscription?.subscription_status === "active" || subscription?.subscription_status === "trialing"
                  ? "Pursuit Pro"
                  : subscription?.subscription_status === "past_due"
                  ? "Payment issue — update your card"
                  : "Free plan"}
              </span>
              <span className="text-xs text-muted-foreground">
                {subscription?.subscription_status === "active" || subscription?.subscription_status === "trialing"
                  ? "AI goal planning unlocked"
                  : "Upgrade to unlock AI goal planning"}
              </span>
            </div>
            {subscription?.stripe_customer_id ? (
              <ManageSubscriptionButton />
            ) : (
              <Link href="/goals/ai" className="text-sm font-medium" style={{ color: "#ff0055" }}>
                Upgrade
              </Link>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="bg-card rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="p-5 flex items-center gap-3 active:bg-secondary transition-colors cursor-pointer border-b border-border/50">
            <Icon icon="solar:logout-2-linear" className="text-foreground text-xl" />
            <SignOutButton />
          </div>
          <div className="p-5 flex items-center gap-3 active:bg-secondary transition-colors cursor-pointer">
            <Icon icon="solar:trash-bin-trash-linear" className="text-destructive text-xl" />
            <DeleteAccountButton />
          </div>
        </section>

        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-4 pb-8">
          {/* Built with 💪 by Rikki */}
        </p>
      </main>
    </div>
  );
}