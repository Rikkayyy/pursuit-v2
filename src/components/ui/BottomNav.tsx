"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname.startsWith("/?");
  const isGoals = pathname.startsWith("/goals");

  return (
    <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex justify-between items-center max-w-md mx-auto relative pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-6">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors ${
            isHome && !isGoals ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon icon={isHome && !isGoals ? "solar:home-2-bold" : "solar:home-2-linear"} className="text-2xl" />
          <span className="text-[10px] font-black tracking-[0.15em] uppercase">Action</span>
        </Link>

        <div className="flex-1 flex justify-center">
          <Link
            href="/goals/new"
            className="w-[60px] h-[60px] rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_25px_rgba(255,0,85,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all -translate-y-6 border-4 border-background group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon icon="material-symbols:add-rounded" className="text-3xl font-bold" />
          </Link>
        </div>

        <Link
          href="/goals"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors group ${
            isGoals ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon
            icon={isGoals ? "solar:target-bold" : "solar:target-linear"}
            className="text-2xl group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] font-black tracking-[0.15em] uppercase">Goals</span>
        </Link>
      </div>
    </nav>
  );
}