"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/" || (pathname.startsWith("/?") && !pathname.startsWith("/goals"));
  const isGoals = pathname.startsWith("/goals");

  return (
    <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-xl z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center max-w-md mx-auto relative pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-6">
        <Link
          href="/"
          className="flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors"
          style={{ color: isHome && !isGoals ? "#ff0055" : "#9ca3af" }}
        >
          <Icon icon={isHome && !isGoals ? "solar:home-2-bold" : "solar:home-2-linear"} className="text-2xl" />
          <span className="text-[10px] font-black tracking-[0.15em] uppercase">Action</span>
        </Link>

        <div className="flex-1 flex justify-center">
          <Link
            href="/goals/new"
            className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all -translate-y-5 border-4 border-background group relative overflow-hidden"
            style={{
              backgroundColor: "#ff0055",
              boxShadow: "0 8px 25px rgba(255, 0, 85, 0.3)",
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon icon="material-symbols:add-rounded" className="text-3xl font-bold text-white" />
          </Link>
        </div>

        <Link
          href="/goals"
          className="flex flex-col items-center gap-1.5 p-2 flex-1 transition-colors group"
          style={{ color: isGoals ? "#ff0055" : "#9ca3af" }}
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