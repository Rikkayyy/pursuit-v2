import Link from "next/link";
import { Icon } from "@iconify/react";
import type { Goal, Milestone, Task } from "@/types";

type GoalWithRelations = Goal & {
  milestones: Pick<Milestone, "id" | "is_completed">[];
  tasks: Pick<Task, "id" | "type" | "frequency">[];
};

type WeeklyStats = {
  rate: number;
  completed: number;
  expected: number;
};

function getGoalIcon(color: string): string {
  const map: Record<string, string> = {
    "#EF4444": "solar:fire-bold",
    "#ff0055": "solar:fire-bold",
    "#F97316": "solar:star-bold",
    "#22C55E": "solar:leaf-bold",
    "#84cc16": "solar:leaf-bold",
    "#3B82F6": "solar:code-bold",
    "#8B5CF6": "solar:book-bold",
    "#171717": "solar:bolt-circle-bold",
  };
  return map[color] || "solar:target-bold";
}

export default function GoalCard({
  goal,
  weeklyStats,
}: {
  goal: GoalWithRelations;
  weeklyStats: WeeklyStats;
}) {
  const totalMilestones = goal.milestones?.length || 0;
  const completedMilestones = goal.milestones?.filter((m) => m.is_completed).length || 0;
  const milestoneProgress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const icon = getGoalIcon(goal.color);

  const bars = [60, 80, 100, 70, 90].map((base) =>
    Math.max(20, Math.min(100, weeklyStats.rate > 0 ? base * (weeklyStats.rate / 100) : 10))
  );

  if (goal.status === "archived") {
    return (
      <Link href={`/goals/${goal.id}`} className="block mb-4">
        <div className="bg-muted/30 border border-border/40 rounded-3xl p-5 shadow-none flex items-center gap-4 group opacity-60">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground text-xl">
            <Icon icon="solar:archive-bold" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-heading font-bold text-muted-foreground">{goal.title}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              ARCHIVED
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (goal.status === "completed") {
    return (
      <Link href={`/goals/${goal.id}`} className="block mb-4">
        <div className="bg-chart-3/5 border border-chart-3/20 rounded-3xl p-5 shadow-none flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-chart-3/10 flex items-center justify-center text-chart-3 text-xl">
            <Icon icon="solar:check-circle-bold" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-heading font-bold text-foreground">{goal.title}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-chart-3">
              COMPLETED
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/goals/${goal.id}`} className="block mb-4">
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all h-[240px] flex flex-col">
        {/* Icon top right */}
        <div className="absolute right-0 top-0 p-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
            style={{
              backgroundColor: `${goal.color}15`,
              color: goal.color,
            }}
          >
            <Icon icon={icon} />
          </div>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold mb-1">{goal.title}</h2>
          {goal.description && (
            <p className="text-muted-foreground text-sm line-clamp-1">{goal.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Milestones */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Milestones
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{completedMilestones}</span>
              <span className="text-muted-foreground text-sm">/ {totalMilestones}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${milestoneProgress}%`,
                  backgroundColor: goal.color,
                }}
              />
            </div>
          </div>

          {/* Weekly Hit Rate */}
          <div className="bg-secondary/40 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Weekly Hit Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{weeklyStats.rate}</span>
              <span className="text-muted-foreground text-sm">%</span>
            </div>
            <div className="flex items-end gap-1 h-4 mt-2">
              {bars.map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-t"
                  style={{
                    height: `${height}%`,
                    backgroundColor: goal.color,
                    opacity: 0.4 + (height / 100) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}