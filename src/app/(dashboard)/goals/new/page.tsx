import GoalForm from "@/components/features/goals/GoalForm";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function NewGoal() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-12 font-sans selection:bg-primary/20">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-heading font-extrabold">New Goal</h1>
        <Link
          href="/goals"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          <Icon icon="solar:close-circle-bold" className="text-2xl" />
        </Link>
      </header>
      <main className="px-6">
        {/* AI Option */}
        {/* <Link href="/goals/ai">
          <div className="mb-8 bg-gradient-to-r from-primary/5 to-chart-5/5 rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
              style={{ backgroundColor: "#ff0055", boxShadow: "0 4px 12px rgba(255, 0, 85, 0.3)" }}
            >
              <Icon icon="solar:magic-stick-3-bold" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-base">AI Goal Planner</h3>
              <p className="text-xs text-muted-foreground">
                Describe your goal and AI will build the plan for you
              </p>
            </div>
            <Icon icon="solar:arrow-right-linear" className="text-muted-foreground" />
          </div>
        </Link> */}

        {/* <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or create manually</span>
          <div className="flex-1 h-px bg-border" />
        </div> */}

        <GoalForm />
      </main>
    </div>
  );
}