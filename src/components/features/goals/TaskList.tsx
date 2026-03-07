import type { Task } from "@/types";

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-600">No systems yet.</p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-3"
        >
          <div>
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-gray-600 capitalize">
              {task.type === "recurring"
                ? `${task.frequency}${task.scheduled_days?.length ? ` · ${task.scheduled_days.length} days` : ""}`
                : "One-time"}
            </p>
          </div>
          {task.type === "recurring" && (
            <span className="text-xs text-gray-600">🔁</span>
          )}
        </div>
      ))}
    </div>
  );
}