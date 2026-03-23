"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans selection:bg-primary/20">
      <div className="w-full max-w-sm space-y-8 p-8">
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl mb-4"
            style={{ backgroundColor: "#ff0055", boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)" }}
          >
            <Icon icon="solar:lock-keyhole-bold" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            {sent
              ? "Check your email for a reset link"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="bg-chart-3/10 border border-chart-3/20 text-chart-3 p-4 rounded-2xl text-sm font-medium text-center">
              <Icon icon="solar:letter-bold" className="text-2xl mb-2 mx-auto block" />
              We sent a reset link to <span className="font-bold">{email}</span>. Check your inbox and click the link to set a new password.
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-heading font-bold text-base active:scale-[0.98] transition-all"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-heading font-extrabold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "#ff0055",
                boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
              {!loading && <Icon icon="solar:arrow-right-linear" className="text-lg" />}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-bold hover:underline" style={{ color: "#ff0055" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}