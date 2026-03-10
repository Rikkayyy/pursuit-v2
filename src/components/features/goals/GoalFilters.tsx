"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="mt-4 flex gap-2">
      {FILTERS.map((f) => {
        const count = counts[f.key as keyof Counts];
        const isActive = current === f.key;

        return (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label} {count > 0 && <span className="ml-1">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}