"use client";

import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/useConfirm";

export default function DeleteAccountButton() {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete your account?",
      description:
        "This will permanently remove all your goals, tasks, and progress. This cannot be undone.",
      destructive: true,
      confirmLabel: "Continue",
    });
    if (!confirmed) return;

    const doubleConfirmed = await confirm({
      title: "This is permanent",
      description: "All your data will be lost. Are you absolutely sure?",
      destructive: true,
      confirmLabel: "Delete Account",
    });
    if (!doubleConfirmed) return;

    const res = await fetch("/api/delete-account", { method: "POST" });
    if (!res.ok) return;

    router.push("/login");
  };

  return (
    <>
      <button
        onClick={handleDelete}
        className="text-sm text-red-500 hover:text-red-700 transition-colors"
      >
        Delete account
      </button>
      {dialog}
    </>
  );
}
