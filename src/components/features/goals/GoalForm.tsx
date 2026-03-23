"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import TaskForm from "@/components/features/systems/TaskForm";

const COLORS = [
  { name: "Red", value: "#ff0055" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#84cc16" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Black", value: "#171717" },
];

type TaskInput = {
  title: string;
  type: "recurring" | "one_time";
  frequency: "daily" | "weekly" | "specific_days";
};

type MilestoneInput = {
  title: string;
};

function NewTaskInput({
  color,
  onAdd,
}: {
  color: string;
  onAdd: (task: TaskInput) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full border-2 border-dashed border-border rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group active:scale-[0.98] tap"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10">
          <Icon
            icon="hugeicons:add-01"
            className="text-xl group-hover:scale-125 transition-transform"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          Add a system
        </span>
      </button>
    );
  }

  return (
    <TaskForm
      goalColor={color}
      onSave={(data) => {
        onAdd(data);
        setIsExpanded(false);
      }}
      onCancel={() => setIsExpanded(false)}
    />
  );
}

export default function GoalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const addTask = () => {
    setTasks([...tasks, { title: "", type: "recurring", frequency: "daily" }]);
  };

  const updateTask = (index: number, field: keyof TaskInput, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const addMilestone = () => {
    if (!milestoneInput.trim()) return;
    setMilestones([...milestones, { title: milestoneInput.trim() }]);
    setMilestoneInput("");
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      setError("Add at least one task to get started.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        color,
      })
      .select()
      .single();

    if (goalError || !goal) {
      setError(goalError?.message || "Failed to create goal.");
      setLoading(false);
      return;
    }

    const taskRows = validTasks.map((t, i) => ({
      goal_id: goal.id,
      title: t.title.trim(),
      type: t.type,
      frequency: t.type === "recurring" ? t.frequency : null,
      sort_order: i,
    }));

    const { error: taskError } = await supabase.from("tasks").insert(taskRows);

    if (taskError) {
      setError(taskError.message);
      setLoading(false);
      return;
    }

    if (milestones.length > 0) {
      const milestoneRows = milestones.map((m, i) => ({
        goal_id: goal.id,
        title: m.title.trim(),
        sort_order: i,
      }));

      const { error: milestoneError } = await supabase
        .from("milestones")
        .insert(milestoneRows);

      if (milestoneError) {
        setError(milestoneError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/goals");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Title & Description */}
      <section className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            What do you want to achieve?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-16 rounded-2xl px-5 font-bold text-lg transition-all outline-none"
            placeholder="e.g., Master Spanish, Build an App"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background min-h-[100px] rounded-2xl p-5 font-medium text-base transition-all outline-none resize-none"
            placeholder="The why behind this goal..."
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
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-12 h-12 rounded-2xl flex-shrink-0 border-4 border-white transition-all ${
                  color === c.value ? "shadow-md ring-2" : "shadow-sm"
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value && { "--tw-ring-color": c.value } as React.CSSProperties),
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-heading font-bold tracking-tight">Milestones (Optional)</h2>
          <Icon icon="solar:info-circle-linear" className="text-muted-foreground" />
        </div>

        {milestones.length > 0 && (
          <div className="space-y-2 mb-4">
            {milestones.map((m, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-secondary/30 rounded-2xl p-4"
              >
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                <span className="flex-1 font-medium">{m.title}</span>
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={milestoneInput}
              onChange={(e) => setMilestoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMilestone();
                }
              }}
              className="flex-1 bg-secondary/50 h-14 rounded-2xl px-5 font-medium outline-none focus:bg-secondary/70 transition-all"
              placeholder="Add a checkpoint..."
            />
            <button
              type="button"
              onClick={addMilestone}
              className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground active:bg-primary active:text-white transition-all"
            >
              <Icon icon="hugeicons:add-01" className="text-xl" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground px-1 italic">
            You can always add more later.
          </p>
        </div>
      </section>

      {/* Systems */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-lg font-heading font-black tracking-tight">
            Define Your Systems
          </h2>
        </div>

        {/* Already added tasks */}
        {tasks.filter((t) => t.title.trim()).length > 0 && (
          <div className="space-y-3">
            {tasks.map((task, index) => {
              if (!task.title.trim()) return null;
              return (
                <div
                  key={index}
                  className="group bg-card border border-border rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm relative overflow-hidden transition-all hover:border-primary/20"
                  style={{ borderLeftColor: color, borderLeftWidth: "4px" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform"
                    style={{ backgroundColor: `${color}15`, color: color }}
                  >
                    <Icon icon={task.type === "recurring" ? "solar:refresh-bold" : "solar:calendar-bold"} className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground text-base leading-tight">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:calendar-bold" style={{ color: `${color}99` }} />
                        {task.type === "recurring"
                          ? task.frequency === "daily" ? "Daily" : task.frequency === "weekly" ? "Weekly" : "Custom Days"
                          : "One-time"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="w-10 h-10 rounded-xl bg-secondary/50 text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* New task input */}
        <NewTaskInput color={color} onAdd={(task) => {
          const emptyIndex = tasks.findIndex((t) => !t.title.trim());
          if (emptyIndex >= 0) {
            const updated = [...tasks];
            updated[emptyIndex] = task;
            setTasks(updated);
          } else {
            setTasks([...tasks, task]);
          }
        }} />
      </section>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="pt-6 pb-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-16 rounded-2xl text-white font-heading font-extrabold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            backgroundColor: color,
            boxShadow: `0 10px 25px ${color}40`,
          }}
        >
          {loading ? "Creating..." : "ACTIVATE GOAL"}
          {!loading && <Icon icon="solar:rocket-bold" className="text-xl" />}
        </button>
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-6">
          GPS Method: Goal • Plan • System
        </p>
      </div>
    </form>
  );
}