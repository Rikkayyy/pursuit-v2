"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(path);
  };

  const isHome = isActive("/") && !isActive("/goals") && !isActive("/settings");
  const isGoals = isActive("/goals");

  return (
    <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex justify-between items-center max-w-md mx-auto px-6 pt-3 pb-[env(safe-area-inset-bottom)] relative pb-4">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors ${
            isHome ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-2xl">{isHome ? "🏠" : "🏠"}</span>
          <span className="text-[10px] font-black tracking-[0.15em] uppercase">Action</span>
        </Link>

        <div className="flex-1 flex justify-center">
          <Link
            href="/goals/new"
            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_25px_rgba(255,0,85,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all -translate-y-5 border-4 border-background"
          >
            <span className="text-2xl font-bold">+</span>
          </Link>
        </div>

        <Link
          href="/goals"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors ${
            isGoals ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-2xl">🎯</span>
          <span className="text-[10px] font-black tracking-[0.15em] uppercase">Goals</span>
        </Link>
      </div>
    </nav>
  );
}