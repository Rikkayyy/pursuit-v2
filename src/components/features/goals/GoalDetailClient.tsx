"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import MilestoneList from "@/components/features/goals/MilestoneList";
import TaskList from "@/components/features/goals/TaskList";
import AddMilestone from "@/components/features/goals/AddMilestone";
import AddTask from "@/components/features/goals/AddTask";
import GoalActions from "@/components/features/goals/GoalActions";
import type { Goal, Milestone, Task } from "@/types";

export default function GoalDetailClient({
  goal,
  milestones,
  tasks,
}: {
  goal: Goal;
  milestones: Milestone[];
  tasks: Task[];
}) {
  const [completionOverrides, setCompletionOverrides] = useState<Record<string, boolean>>({});

  const getEffectiveCompleted = (id: string, serverCompleted: boolean) => {
    return completionOverrides[id] !== undefined ? completionOverrides[id] : serverCompleted;
  };

  const onMilestoneToggle = (milestoneId: string, newState: boolean) => {
    setCompletionOverrides((prev) => ({ ...prev, [milestoneId]: newState }));
  };

  // Calculate local stats
  const completedMilestones = milestones.filter((m) =>
    getEffectiveCompleted(m.id, m.is_completed)
  ).length;
  const milestonePercent = milestones.length > 0
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: `${goal.color}15`, text: goal.color },
    completed: { bg: "rgb(134 239 172 / 0.15)", text: "#16a34a" },
    archived: { bg: "rgb(156 163 175 / 0.15)", text: "#6b7280" },
  };
  const statusStyle = statusColors[goal.status] || statusColors.active;

  return (
    <>
      <div className="h-10" />

      {/* Header */}
      <header className="px-6 flex items-center justify-between mb-8">
        <Link
          href="/goals"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          <Icon icon="solar:arrow-left-linear" className="text-xl" />
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="px-4 py-2 rounded-full font-bold text-xs uppercase"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {goal.status}
          </span>
          <GoalActions goal={goal} />
        </div>
      </header>

      <main className="px-6 space-y-10">
        {/* Goal Info */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: goal.color }}
            >
              <Icon icon="solar:fire-bold" />
            </div>
            <h1 className="text-3xl font-heading font-extrabold">{goal.title}</h1>
          </div>
          {goal.description && (
            <p className="text-muted-foreground text-base leading-relaxed">{goal.description}</p>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
              >
                <Icon icon="solar:medal-bold" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Milestones
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-heading font-bold transition-all duration-300">{completedMilestones}</span>
              <span className="text-muted-foreground text-lg">/ {milestones.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{milestones.length - completedMilestones} remaining</p>
          </div>
          <div className="bg-card rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center">
                <Icon icon="solar:flame-bold" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-heading font-bold transition-all duration-300">{milestonePercent}</span>
              <span className="text-muted-foreground text-lg">%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${milestonePercent}%`, backgroundColor: goal.color }}
              />
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              Milestones
              <span className="bg-secondary px-2 py-0.5 rounded text-xs text-muted-foreground font-bold transition-all duration-300">
                {milestonePercent}%
              </span>
            </h2>
            <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
              {milestones.length} total
            </span>
          </div>
          <MilestoneList milestones={milestones} goalColor={goal.color} onToggle={onMilestoneToggle} />
          <AddMilestone goalId={goal.id} nextOrder={milestones.length} />
        </section>

        {/* Systems */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold">Systems</h2>
            <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
              {tasks.length} tasks
            </span>
          </div>
          <TaskList tasks={tasks} goalColor={goal.color} />
          <AddTask goalId={goal.id} nextOrder={tasks.length} goalColor={goal.color} />
        </section>
      </main>
    </>
  );
}