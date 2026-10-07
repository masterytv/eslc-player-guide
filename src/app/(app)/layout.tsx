import { Freshness } from "@/components/Freshness";
import { WarmPages } from "@/components/SwRegister";
import { TabBar } from "@/components/TabBar";
import { loadGuide } from "@/lib/content";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireViewer();
  const { guide } = await loadGuide();
  const pages = [...guide.pages.map((p) => `/more/${p.slug}`), ...guide.playbook.map((p) => `/more/game-plan/${p.slug}`)];
  return (
    <div className="shell">
      {children}
      <TabBar />
      {/* Rendered once per request on the server: the time tells the page a refresh has landed. */}
      {/* eslint-disable-next-line react-hooks/purity */}
      <Freshness renderedAt={Date.now()} />
      <WarmPages pages={pages} />
    </div>
  );
}
