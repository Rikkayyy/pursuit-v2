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
        <GoalForm />
      </main>
    </div>
  );
}