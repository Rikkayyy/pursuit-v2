"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function UpgradeCTA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start checkout");

      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans px-6">
      <div className="text-center space-y-4 max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl"
          style={{ backgroundColor: "#ff0055", boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)" }}
        >
          <Icon icon="solar:magic-stick-3-bold" />
        </div>
        <h2 className="text-xl font-heading font-extrabold">AI Goal Planner is a Pro feature</h2>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pursuit Pro to generate personalized goal plans with AI — $5/month.
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={startCheckout}
          disabled={loading}
          className="w-full h-14 rounded-2xl text-white font-heading font-extrabold active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "#ff0055", boxShadow: "0 10px 25px rgba(255, 0, 85, 0.3)" }}
        >
          {loading ? "Redirecting..." : "Upgrade to Pro"}
        </button>
        <Link href="/goals/new" className="block text-sm font-bold text-muted-foreground pt-2">
          Create a goal manually instead
        </Link>
      </div>
    </div>
  );
}
