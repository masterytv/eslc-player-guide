import { TabBar } from "@/components/TabBar";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireViewer();
  return (
    <div className="shell">
      {children}
      <TabBar />
    </div>
  );
}
