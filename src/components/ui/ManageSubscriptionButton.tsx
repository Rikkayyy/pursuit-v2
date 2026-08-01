"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });

      if (res.status === 404) {
        // No manageable subscription on record — send them to upgrade instead.
        window.location.href = "/goals/ai";
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to open billing portal");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Couldn't open billing portal. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Loading..." : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
