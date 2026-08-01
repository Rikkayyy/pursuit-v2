"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm font-medium disabled:opacity-50"
    >
      {loading ? "Loading..." : "Manage subscription"}
    </button>
  );
}
