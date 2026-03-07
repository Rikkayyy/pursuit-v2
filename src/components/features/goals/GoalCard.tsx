import Link from "next/link";
import type { Goal, Milestone, Task } from "@/types";

type GoalWithRelations = Goal & {
  milestones: Pick<Milestone, "id" | "is_completed">[];
  tasks: Pick<Task, "id" | "type" | "frequency">[];
};

export default function GoalCard({ goal }: { goal: GoalWithRelations }) {
  const totalMilestones = goal.milestones?.length || 0;
  const completedMilestones = goal.milestones?.filter((m) => m.is_completed).length || 0;
  const milestoneProgress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              <h3 className="font-semibold">{goal.title}</h3>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-700 line-clamp-1">{goal.description}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Milestones
            </p>
            <p className="text-sm font-medium">
              {completedMilestones} / {totalMilestones}
            </p>
          </div>

          {totalMilestones > 0 && (
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${milestoneProgress}%`,
                    backgroundColor: goal.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}