import BottomNav from "@/components/ui/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-24">
      {children}
      <BottomNav />
    </div>
  );
}