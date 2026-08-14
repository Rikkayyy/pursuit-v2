import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDailyStats } from "@/lib/stats";
import { getSafeTimezone } from "@/lib/util";
import StatsView from "./StatsView";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const timezone = getSafeTimezone(cookieStore.get("user_timezone")?.value);

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: timezone });

  // Start 13 months ago to support monthly navigation + full grid
  const startDateObj = new Date(now);
  startDateObj.setMonth(startDateObj.getMonth() - 13);
  const startDate = startDateObj.toLocaleDateString("en-CA", {
    timeZone: timezone,
  });

  const { data: goals } = await supabase
    .from("goals")
    .select(`
      tasks (
        id,
        type,
        frequency,
        scheduled_days
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  type RawTask = {
    id: string;
    type: string;
    frequency: string | null;
    scheduled_days: number[] | null;
  };

  const allTasks =
    goals?.flatMap((g: { tasks: RawTask[] | null }) =>
      (g.tasks || []).map((t: RawTask) => ({
        id: t.id,
        type: t.type,
        frequency: t.frequency ?? null,
        scheduled_days: t.scheduled_days ?? null,
      }))
    ) || [];

  const stats = await getDailyStats(
    supabase,
    allTasks,
    startDate,
    today,
    timezone
  );

  return <StatsView stats={stats} today={today} />;
}
