"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const COLORS = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
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

export default function GoalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [tasks, setTasks] = useState<TaskInput[]>([
    { title: "", type: "recurring", frequency: "daily" },
  ]);
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
    setMilestones([...milestones, { title: "" }]);
  };

  const updateMilestone = (index: number, value: string) => {
    const updated = [...milestones];
    updated[index] = { title: value };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate at least one task has a title
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

    // Create goal
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

    // Create tasks
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

    // Create milestones
    const validMilestones = milestones.filter((m) => m.title.trim());
    if (validMilestones.length > 0) {
      const milestoneRows = validMilestones.map((m, i) => ({
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          What do you want to achieve?
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Master Spanish, Build an App"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The why behind this goal..."
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pick a theme color
        </label>
        <div className="mt-2 flex gap-3">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`h-8 w-8 rounded-full transition-all ${
                color === c.value
                  ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Define Your Systems
          </label>
          <button
            type="button"
            onClick={addTask}
            className="text-xs font-medium text-black hover:underline"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          The recurring tasks that drive you toward your goal every day.
        </p>
        <div className="mt-3 space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(index, "title", e.target.value)}
                  placeholder="Task name (e.g., Study 30 mins)"
                  className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={task.type}
                  onChange={(e) => updateTask(index, "type", e.target.value)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-black focus:outline-none"
                >
                  <option value="recurring">Recurring</option>
                  <option value="one_time">One-time</option>
                </select>
                {task.type === "recurring" && (
                  <select
                    value={task.frequency}
                    onChange={(e) => updateTask(index, "frequency", e.target.value)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-black focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="specific_days">Specific Days</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Milestones (optional)
          </label>
          <button
            type="button"
            onClick={addMilestone}
            className="text-xs font-medium text-black hover:underline"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Checkpoints that mark progress toward your goal.
        </p>
        {milestones.length > 0 && (
          <div className="mt-3 space-y-2">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, e.target.value)}
                  placeholder="e.g., Complete 50 kanji"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Creating goal..." : "Create Goal"}
      </button>
    </form>
  );
}