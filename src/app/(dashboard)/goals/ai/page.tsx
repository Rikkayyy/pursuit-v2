import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/api/subscriptions";
import AIGoalPlanner from "./AIGoalPlanner";
import UpgradeCTA from "./UpgradeCTA";

export default async function AIGoalPlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isPro = user ? await isSubscriptionActive(supabase, user.id) : false;

  if (!isPro) {
    return <UpgradeCTA />;
  }

  return <AIGoalPlanner />;
}
