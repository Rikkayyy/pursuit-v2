"use client";

import { useRouter } from "next/navigation";

type Counts = {
  active: number;
  completed: number;
  archived: number;
};

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

export default function GoalFilters({
  current,
  counts,
}: {
  current: string;
  counts: Counts;
}) {
  const router = useRouter();

  const handleFilter = (key: string) => {
    router.push(`/goals?filter=${key}`);
  };

  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => {
        const count = counts[f.key as keyof Counts];
        const isActive = current === f.key;

        return (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label} {count > 0 && <span className="ml-1">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}