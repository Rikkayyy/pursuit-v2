"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto px-6 py-2 pb-[env(safe-area-inset-bottom)]">
        {/* Action / Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
            isActive("/") && !isActive("/goals")
              ? "text-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Action</span>
        </Link>

        {/* Create Goal */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/goals/new"
            className="w-12 h-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all -translate-y-3 border-4 border-white"
          >
            <span className="text-xl">+</span>
          </Link>
        </div>

        {/* Goals */}
        <Link
          href="/goals"
          className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
            isActive("/goals")
              ? "text-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <span className="text-xl">🎯</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Goals</span>
        </Link>
      </div>
    </nav>
  );
}