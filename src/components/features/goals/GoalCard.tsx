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

  // Generate mini bar chart heights based on hit rate
  const barCount = 5;
  const bars = Array.from({ length: barCount }, () =>
    Math.max(20, Math.min(100, weeklyStats.rate + (Math.random() * 30 - 15)))
  );

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <h3 className="text-lg font-bold">{goal.title}</h3>
          </div>
          {goal.description && (
            <p className="text-sm text-gray-700 line-clamp-1">{goal.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Milestones */}
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
              Milestones
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold">{completedMilestones}</span>
              <span className="text-sm text-gray-700">/ {totalMilestones}</span>
            </div>
            {totalMilestones > 0 && (
              <div className="h-1.5 w-full rounded-full bg-gray-200 mt-2">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${milestoneProgress}%`,
                    backgroundColor: goal.color,
                  }}
                />
              </div>
            )}
          </div>

          {/* Weekly Hit Rate */}
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
              Weekly Hit Rate
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold">{weeklyStats.rate}</span>
              <span className="text-sm text-gray-700">%</span>
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