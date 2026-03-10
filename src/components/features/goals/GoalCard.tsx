import Link from "next/link";
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

  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) =>
    Math.max(20, Math.min(100, weeklyStats.rate + ((i * 13 + 7) % 30) - 15))
  );

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: goal.color,
                boxShadow: `0 0 8px ${goal.color}66`,
              }}
            />
            <h2 className="text-2xl font-heading font-bold">{goal.title}</h2>
          </div>
          {goal.description && (
            <p className="text-muted-foreground text-sm line-clamp-1 mt-1">{goal.description}</p>
          )}
        </div>

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
            {totalMilestones > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${milestoneProgress}%`,
                    backgroundColor: goal.color,
                  }}
                />
              </div>
            )}
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