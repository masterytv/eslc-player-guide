import { Freshness } from "@/components/Freshness";
import { TabBar } from "@/components/TabBar";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireViewer();
  return (
    <div className="shell">
      {children}
      <TabBar />
      {/* Rendered once per request on the server: the time tells the page a refresh has landed. */}
      {/* eslint-disable-next-line react-hooks/purity */}
      <Freshness renderedAt={Date.now()} />
    </div>
  );
}
