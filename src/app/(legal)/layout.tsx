import Link from "next/link";
import { Icon } from "@iconify/react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <main className="max-w-2xl mx-auto px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground mb-8"
        >
          <Icon icon="solar:arrow-left-linear" />
          Back to Pursuit
        </Link>
        {children}
        <nav className="flex gap-6 text-sm font-medium text-muted-foreground border-t border-border/50 pt-6 mt-12">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </nav>
      </main>
    </div>
  );
}
