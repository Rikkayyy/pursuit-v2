"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@iconify/react";
import Link from "next/link";

type GeneratedPlan = {
  title: string;
  description: string;
  milestones: { title: string }[];
  tasks: { title: string; type: "recurring" | "one_time"; frequency: string }[];
};

const COLORS = [
  { name: "Red", value: "#ff0055" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#84cc16" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Black", value: "#171717" },
];

export default function AIGoalPlanner() {
  const [step, setStep] = useState<"input" | "loading" | "review">("input");
  const [goalDescription, setGoalDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [experience, setExperience] = useState("");
  const [dailyTime, setDailyTime] = useState("");
  const [constraints, setConstraints] = useState("");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [color, setColor] = useState(COLORS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const generatePlan = async () => {
    setError(null);
    setStep("loading");

    try {
      const res = await fetch("/api/ai/generate-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalDescription,
          timeline,
          experience,
          dailyTime,
          constraints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setPlan(data);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("input");
    }
  };

  const updateMilestone = (index: number, title: string) => {
    if (!plan) return;
    const updated = { ...plan };
    updated.milestones[index].title = title;
    setPlan(updated);
  };

  const removeMilestone = (index: number) => {
    if (!plan) return;
    const updated = { ...plan };
    updated.milestones = updated.milestones.filter((_, i) => i !== index);
    setPlan(updated);
  };

  const updateTask = (index: number, field: string, value: string) => {
    if (!plan) return;
    const updated = { ...plan };
    updated.tasks[index] = { ...updated.tasks[index], [field]: value };
    setPlan(updated);
  };

  const removeTask = (index: number) => {
    if (!plan) return;
    const updated = { ...plan };
    updated.tasks = updated.tasks.filter((_, i) => i !== index);
    setPlan(updated);
  };

  const activateGoal = async () => {
    if (!plan) return;
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: plan.title,
        description: plan.description || null,
        color,
      })
      .select()
      .single();

    if (goalError || !goal) {
      setError(goalError?.message || "Failed to create goal.");
      setSaving(false);
      return;
    }

    if (plan.milestones.length > 0) {
      const milestoneRows = plan.milestones.map((m, i) => ({
        goal_id: goal.id,
        title: m.title,
        sort_order: i,
      }));
      await supabase.from("milestones").insert(milestoneRows);
    }

    if (plan.tasks.length > 0) {
      const taskRows = plan.tasks.map((t, i) => ({
        goal_id: goal.id,
        title: t.title,
        type: t.type,
        frequency: t.type === "recurring" ? t.frequency : null,
        sort_order: i,
      }));
      await supabase.from("tasks").insert(taskRows);
    }

    router.push("/goals");
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <div className="text-center space-y-4 p-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl animate-pulse"
            style={{ backgroundColor: "#ff0055", boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)" }}
          >
            <Icon icon="solar:magic-stick-3-bold" />
          </div>
          <h2 className="text-xl font-heading font-extrabold">Building your plan...</h2>
          <p className="text-sm text-muted-foreground">AI is crafting milestones and systems for your goal</p>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#ff0055", animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#ff0055", animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "#ff0055", animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // Review state
  if (step === "review" && plan) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-12 font-sans selection:bg-primary/20">
        <header className="px-6 pt-12 pb-6 flex items-center justify-between">
          <h1 className="text-2xl font-heading font-extrabold">Review Plan</h1>
          <button
            onClick={() => { setStep("input"); setPlan(null); }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
          >
            <Icon icon="solar:arrow-left-linear" className="text-xl" />
          </button>
        </header>

        <main className="px-6 space-y-8">
          {/* Title & Description */}
          <section className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
                Goal Title
              </label>
              <input
                type="text"
                value={plan.title}
                onChange={(e) => setPlan({ ...plan, title: e.target.value })}
                className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-16 rounded-2xl px-5 font-bold text-lg transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
                Description
              </label>
              <textarea
                value={plan.description}
                onChange={(e) => setPlan({ ...plan, description: e.target.value })}
                className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background min-h-[80px] rounded-2xl p-5 font-medium text-base transition-all outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
                Pick a theme color
              </label>
              <div className="flex gap-3 py-2 px-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-12 h-12 rounded-2xl flex-shrink-0 border-4 border-white transition-all ${
                      color === c.value ? "shadow-md ring-2" : "shadow-sm"
                    }`}
                    style={{
                      backgroundColor: c.value,
                      ...(color === c.value && { "--tw-ring-color": c.value } as React.CSSProperties),
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Milestones */}
          <section>
            <h2 className="text-lg font-heading font-bold tracking-tight mb-4 px-1">
              Milestones
              <span className="text-muted-foreground text-sm font-normal ml-2">Tap to edit</span>
            </h2>
            <div className="space-y-3">
              {plan.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{ borderColor: color }}
                  />
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, e.target.value)}
                    className="flex-1 bg-transparent font-bold text-foreground outline-none"
                  />
                  <button
                    onClick={() => removeMilestone(i)}
                    className="text-muted-foreground/30 hover:text-destructive transition-colors"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks */}
          <section>
            <h2 className="text-lg font-heading font-bold tracking-tight mb-4 px-1">
              Systems
              <span className="text-muted-foreground text-sm font-normal ml-2">Tap to edit</span>
            </h2>
            <div className="space-y-3">
              {plan.tasks.map((t, i) => (
                <div
                  key={i}
                  className="bg-card rounded-[1.5rem] p-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}15`, color: color }}
                  >
                    <Icon icon={t.type === "recurring" ? "solar:refresh-bold" : "solar:calendar-bold"} />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => updateTask(i, "title", e.target.value)}
                      className="w-full bg-transparent font-bold text-foreground outline-none"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      {(["daily", "weekly"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => { updateTask(i, "type", "recurring"); updateTask(i, "frequency", f); }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            t.type === "recurring" && t.frequency === f
                              ? "text-white"
                              : "bg-secondary text-muted-foreground"
                          }`}
                          style={{
                            backgroundColor: t.type === "recurring" && t.frequency === f ? color : undefined,
                          }}
                        >
                          {f}
                        </button>
                      ))}
                      <button
                        onClick={() => updateTask(i, "type", "one_time")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          t.type === "one_time"
                            ? "text-white"
                            : "bg-secondary text-muted-foreground"
                        }`}
                        style={{
                          backgroundColor: t.type === "one_time" ? color : undefined,
                        }}
                      >
                        Once
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeTask(i)}
                    className="text-muted-foreground/30 hover:text-destructive transition-colors"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 pb-4">
            <button
              onClick={activateGoal}
              disabled={saving}
              className="w-full h-16 rounded-2xl text-white font-heading font-extrabold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: color,
                boxShadow: `0 10px 25px ${color}40`,
              }}
            >
              {saving ? "Creating..." : "ACTIVATE GOAL"}
              {!saving && <Icon icon="solar:rocket-bold" className="text-xl" />}
            </button>
            <button
              onClick={() => generatePlan()}
              className="w-full h-12 rounded-2xl bg-secondary text-secondary-foreground font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Icon icon="solar:magic-stick-3-linear" />
              Regenerate Plan
            </button>
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              AI-Powered GPS: Goal • Plan • System
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Input state
  return (
    <div className="min-h-screen bg-background text-foreground pb-12 font-sans selection:bg-primary/20">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-heading font-extrabold">AI Goal Planner</h1>
        <Link
          href="/goals/new"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          <Icon icon="solar:close-circle-bold" className="text-2xl" />
        </Link>
      </header>

      <main className="px-6 space-y-6">
        <div className="text-center space-y-2 py-4">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: "#ff0055", boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)" }}
          >
            <Icon icon="solar:magic-stick-3-bold" />
          </div>
          <p className="text-sm text-muted-foreground">
            Describe what you want to achieve and AI will create a structured plan with milestones and daily systems.
          </p>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            What do you want to achieve?
          </label>
          <textarea
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background min-h-[120px] rounded-2xl p-5 font-medium text-base transition-all outline-none resize-none"
            placeholder="e.g., I want to pass the JLPT N4 Japanese exam in 6 months..."
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            Timeline
          </label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
            placeholder="e.g., 6 months, by December 2026"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            Current experience level
          </label>
          <input
            type="text"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
            placeholder="e.g., Complete beginner, know some basics"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            Daily time available
          </label>
          <input
            type="text"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
            placeholder="e.g., 30 minutes, 1 hour"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            Anything else to consider? (Optional)
          </label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background min-h-[80px] rounded-2xl p-5 font-medium text-base transition-all outline-none resize-none"
            placeholder="e.g., I work full time, weekends are more flexible..."
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="pt-4 pb-4">
          <button
            onClick={generatePlan}
            disabled={!goalDescription.trim()}
            className="w-full h-16 rounded-2xl text-white font-heading font-extrabold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: "#ff0055",
              boxShadow: "0 10px 25px rgba(255, 0, 85, 0.3)",
            }}
          >
            Generate Plan
            <Icon icon="solar:magic-stick-3-bold" className="text-xl" />
          </button>
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-6">
            Powered by AI • GPS Method
          </p>
        </div>
      </main>
    </div>
  );
}