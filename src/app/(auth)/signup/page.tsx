"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans selection:bg-primary/20">
      <div className="w-full max-w-sm space-y-8 p-8">
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl mb-4"
            style={{ backgroundColor: "#ff0055", boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)" }}
          >
            <Icon icon="solar:rocket-bold" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold">Create an account</h1>
          <p className="text-sm text-muted-foreground">Start tracking your goals with Pursuit</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/30 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 px-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-secondary/50 border-2 focus:bg-background h-14 rounded-2xl px-5 font-medium text-base transition-all outline-none"
              style={{
                borderColor: confirmPassword
                  ? password !== confirmPassword
                    ? "#ef4444"
                    : "#84cc16"
                  : "transparent",
              }}
              placeholder="Re-enter your password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive mt-1 px-1 font-medium">Passwords do not match</p>
            )}
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
            {loading ? "Creating account..." : "Get Started"}
            {!loading && <Icon icon="solar:arrow-right-linear" className="text-lg" />}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold hover:underline" style={{ color: "#ff0055" }}>
            Log in
          </Link>
        </p>

        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          GPS Method: Goal • Plan • System
        </p>
      </div>
    </div>
  );
}