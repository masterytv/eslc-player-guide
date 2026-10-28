import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SectionEditor, type ShownWith } from "@/components/SectionEditor";
import { loadGuide } from "@/lib/content";
import { byTime, defaultDay, isGameDay, mealTimeLabel, scheduleTitle, tripDays, TYPE_LABEL } from "@/lib/plan";
import { isSectionKey, type Guide } from "@/lib/schema";
import { sectionDef } from "@/lib/sections";
import { clockLabel, isDate, zonedNow } from "@/lib/time";

type Params = Promise<{ section: string }>;

/**
 * What Today lists with a day's notes that's kept in other sections: the day's schedule and meals,
 * and the walk note on game days. The notes editor shows these so staff can find them.
 */
function shownWithNotes(guide: Guide): ShownWith[] {
  const events = [...guide.schedule]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : byTime(a, b)))
    .map((s) => ({
      id: s.id,
      date: s.date,
      title: `${clockLabel(s.time)} · ${scheduleTitle(s)}`,
      from: `Schedule · ${TYPE_LABEL[s.type]}`,
      href: `/admin/schedule?day=${s.date}&item=${s.id}`,
    }));
  const meals = [...guide.meals]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : byTime(a, b)))
    .map((m) => ({
      id: m.id,
      date: m.date,
      title: `${mealTimeLabel(m)} · ${m.meal}`,
      from: "Venue · Meals",
      href: `/admin/meals?day=${m.date}&item=${m.id}`,
    }));
  const gameDays = [...new Set(guide.schedule.map((s) => s.date))].filter((d) => isGameDay(guide, d));
  const walk = guide.venue.walkNote
    ? gameDays.map((d) => ({ id: `walk-${d}`, date: d, title: guide.venue.walkNote, from: "Venue · Getting there, shown on game days", href: "/admin/venue" }))
    : [];
  return [...events, ...meals, ...walk];
}
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

  const { id, guide, meta } = await loadGuide();
  const days = tripDays(guide);
  const today = zonedNow(new Date(), guide.event.timeZone).date;
  const wanted = typeof sp.day === "string" && isDate(sp.day) ? sp.day : null;
  // Daily notes open on the day being planned; the schedule opens on everything.
  const startDay = wanted ?? (def.key === "daily" && days.length ? defaultDay(days, today) : null);

  return (
    <>
      <Header title={def.title} eyebrow="Edit the guide" back="/admin" />
      <main className="main no-tabs">
        <SectionEditor
          tournament={id}
          sectionKey={def.key}
          initial={guide[def.key] as never}
          version={meta[def.key].version}
          updatedAt={meta[def.key].updatedAt}
          days={days}
          startDay={startDay}
          focusItem={typeof sp.item === "string" ? sp.item : null}
          shownWith={def.key === "daily" ? shownWithNotes(guide) : []}
        />
      </main>
    </>
  );
}
