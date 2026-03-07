"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Goal } from "@/types";

export default function GoalActions({ goal }: { goal: Goal }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || "");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await supabase
      .from("goals")
      .update({
        title: title.trim(),
        description: description.trim() || null,
      })
      .eq("id", goal.id);

    setLoading(false);
    setShowEdit(false);
    router.refresh();
  };

  const handleArchive = async () => {
    if (!confirm("Archive this goal? You can restore it later.")) return;

    await supabase
      .from("goals")
      .update({ status: "archived" })
      .eq("id", goal.id);

    router.push("/goals");
  };

  const handleComplete = async () => {
    if (!confirm("Mark this goal as completed?")) return;

    await supabase
      .from("goals")
      .update({ status: "completed" })
      .eq("id", goal.id);

    router.push("/goals");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this goal permanently? This will remove all milestones and tasks.")) return;

    await supabase
      .from("goals")
      .delete()
      .eq("id", goal.id);

    router.push("/goals");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-gray-600 hover:text-black text-lg"
      >
        •••
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-50 w-48 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setShowMenu(false);
                setShowEdit(true);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Goal
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                handleComplete();
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-green-600"
            >
              Mark as Completed
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                handleArchive();
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                handleDelete();
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-red-500"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowEdit(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Edit Goal</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-black py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}