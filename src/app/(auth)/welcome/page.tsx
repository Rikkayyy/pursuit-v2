import Link from "next/link";
import { Icon } from "@iconify/react";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Hero */}
      <div className="px-6 pt-20 pb-12 text-center">
        <div
          className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl mb-8"
          style={{ backgroundColor: "#ff0055", boxShadow: "0 12px 40px rgba(255, 0, 85, 0.3)" }}
        >
          <Icon icon="solar:target-bold" />
        </div>

        <h1 className="text-4xl font-heading font-extrabold tracking-tight mb-4">
          Pursuit
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Turn big goals into daily systems. Track your progress. Stay consistent.
        </p>
      </div>

      {/* GPS Method */}
      <div className="px-6 pb-12">
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
              style={{ backgroundColor: "#ff0055" }}
            >
              <Icon icon="solar:flag-bold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">Goal</h3>
              <p className="text-xs text-muted-foreground">Define what you want to achieve</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-border" />
          </div>

          <div className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
              style={{ backgroundColor: "#f97316" }}
            >
              <Icon icon="solar:map-point-bold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">Plan</h3>
              <p className="text-xs text-muted-foreground">Set milestones as checkpoints along the way</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-border" />
          </div>

          <div className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0"
              style={{ backgroundColor: "#3b82f6" }}
            >
              <Icon icon="solar:refresh-bold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">System</h3>
              <p className="text-xs text-muted-foreground">Build daily habits that drive real progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-12">
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Icon icon="solar:fire-bold" className="text-2xl mx-auto mb-2" style={{ color: "#ff0055" }} />
            <p className="text-xs font-bold">Streak Tracking</p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Icon icon="solar:chart-2-bold" className="text-2xl mx-auto mb-2" style={{ color: "#f97316" }} />
            <p className="text-xs font-bold">Weekly Hit Rate</p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Icon icon="solar:magic-stick-3-bold" className="text-2xl mx-auto mb-2" style={{ color: "#8b5cf6" }} />
            <p className="text-xs font-bold">AI Goal Planner</p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Icon icon="solar:calendar-bold" className="text-2xl mx-auto mb-2" style={{ color: "#3b82f6" }} />
            <p className="text-xs font-bold">Daily Focus View</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-20 max-w-sm mx-auto space-y-3">
        <Link
          href="/signup"
          className="w-full h-16 rounded-2xl text-white font-heading font-extrabold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: "#ff0055",
            boxShadow: "0 10px 25px rgba(255, 0, 85, 0.3)",
          }}
        >
          Get Started
          <Icon icon="solar:arrow-right-linear" className="text-xl" />
        </Link>
        <Link
          href="/login"
          className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-heading font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Log in
        </Link>
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-4">
          GPS Method: Goal • Plan • System
        </p>
      </div>
    </div>
  );
}