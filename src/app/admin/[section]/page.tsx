import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SectionEditor } from "@/components/SectionEditor";
import { loadGuide } from "@/lib/content";
import { defaultDay, tripDays } from "@/lib/plan";
import { isSectionKey } from "@/lib/schema";
import { sectionDef } from "@/lib/sections";
import { isDate, zonedNow } from "@/lib/time";

type Params = Promise<{ section: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const def = sectionDef((await params).section);
  return { title: def ? `Edit ${def.title.toLowerCase()}` : "Not found" };
}

export default async function EditSectionPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { section } = await params;
  const sp = await searchParams;
  const def = sectionDef(section);
  if (!def || !isSectionKey(section)) notFound();

  const { guide, meta } = await loadGuide();
  const days = tripDays(guide);
  const today = zonedNow().date;
  const wanted = typeof sp.day === "string" && isDate(sp.day) ? sp.day : null;
  // Daily notes open on the day being planned; the schedule opens on everything.
  const startDay = wanted ?? (def.key === "daily" && days.length ? defaultDay(days, today) : null);

  return (
    <>
      <Header title={def.title} eyebrow="Edit the guide" back="/admin" />
      <main className="main no-tabs">
        <SectionEditor
          sectionKey={def.key}
          initial={guide[def.key] as never}
          version={meta[def.key].version}
          updatedAt={meta[def.key].updatedAt}
          days={days}
          startDay={startDay}
          focusItem={typeof sp.item === "string" ? sp.item : null}
        />
      </main>
    </>
  );
}
