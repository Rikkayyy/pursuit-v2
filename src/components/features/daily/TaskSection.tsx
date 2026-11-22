import type { ReactNode } from "react";

// Thin line with a centered label, separating a goal's sections.
function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3" role="separator">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// One section of a goal (Daily / Weekly / Anytime): an optional divider, then its tasks.
// Renders nothing when the section is empty.
export default function TaskSection({
  show,
  label,
  children,
}: {
  show: boolean;
  label?: string;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <div>
      {label && <SectionDivider>{label}</SectionDivider>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}
