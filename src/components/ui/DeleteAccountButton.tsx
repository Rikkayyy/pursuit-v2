"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This will permanently remove all your goals, tasks, and progress. This cannot be undone."
    );
    if (!confirmed) return;

    const doubleConfirm = confirm(
      "This is permanent. All your data will be lost. Are you absolutely sure?"
    );
    if (!doubleConfirm) return;

    // Delete all user goals (cascades to milestones, tasks, task_logs)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("goals").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-700 transition-colors"
    >
      Delete account
    </button>
  );
}