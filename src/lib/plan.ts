import type { Guide, Row, ScheduleType } from "./schema";
import { clockLabel, clockRange, dateRange, toMinutes, zonedToUtc } from "./time";

export const TYPE_LABEL: Record<ScheduleType | "note" | "meal", string> = {
  game: "Pool play",
  practice: "Practice",
  ceremony: "Ceremony",
  meeting: "Meeting",
  other: "Event",
  note: "Note",
  meal: "Meal",
};

export interface Entry {
  id: string;
  date: string;
  time: string;
  /** Set only for meals with open hours: Today shows the whole range, not a big start time. */
  endTime: string;
  kind: ScheduleType | "note" | "meal";
  title: string;
  meta: string;
  details: string;
  link: { label: string; href: string } | null;
  game: Row<"schedule"> | null;
}

export function gameTitle(row: Row<"schedule">): string {
  return row.opponent ? `Ireland vs ${row.opponent}` : row.title || "Game";
}

export function scheduleTitle(row: Row<"schedule">): string {
  return row.type === "game" ? gameTitle(row) : row.title || TYPE_LABEL[row.type];
}

/** "2" and "TBD" read as "Field 2" and "Field TBD"; a named place ("Practice field, Salou") reads as written. */
export function fieldLabel(field: string): string {
  if (!field) return "";
  return /^field/i.test(field) || !/^[\w-]{1,4}$/.test(field) ? field : `Field ${field}`;
}

/** "Until 6:30 PM" when a non-game item has an end time. */
export function untilLabel(row: Row<"schedule">): string {
  return row.type !== "game" && row.endTime ? `Until ${clockLabel(row.endTime)}` : "";
}

export function scheduleMeta(row: Row<"schedule">): string {
  if (row.type === "game") {
    return [row.round, row.field, row.warmup ? `Warm-up ${clockLabel(row.warmup)}` : "Warm-up TBC"].filter(Boolean).join(" · ");
  }
  return [untilLabel(row), fieldLabel(row.field)].filter(Boolean).join(" · ");
}

/** Sorts by time, with items whose time isn't set yet (TBC) at the end. */
export function byTime<T extends { time: string }>(a: T, b: T): number {
  const ta = toMinutes(a.time);
  const tb = toMinutes(b.time);
  if (ta == null && tb == null) return 0;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return ta - tb;
}

/** "12:00–15:00 · Buffet Masia" for open hours, "Arrive 13:30 · Buffet Masia" for our set time. */
export function mealMeta(row: Row<"meals">): string {
  const r = clockRange(row.time, row.endTime);
  const when = r ? (row.endTime ? r.h24 : `Arrive ${r.h24}`) : "";
  return [when, row.place].filter(Boolean).join(" · ");
}

/** "12:00–3:00 PM (12:00–15:00)" for open hours, "Arrive 1:30 PM (13:30)" for our set time. */
export function mealTimeLabel(row: Row<"meals">): string {
  const r = clockRange(row.time, row.endTime);
  if (!r) return "Time to be confirmed";
  return `${row.endTime ? "" : "Arrive "}${r.hm} ${r.ap} (${r.h24})`;
}

/** A day's meals in time order. */
export function mealsFor(guide: Guide, date: string): Row<"meals">[] {
  return guide.meals.filter((m) => m.date === date).sort(byTime);
}

/** Daily notes, schedule items and meals for one day, in time order. */
export function entriesFor(guide: Guide, date: string): Entry[] {
  const notes: Entry[] = guide.daily
    .filter((d) => d.date === date)
    .map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
      endTime: "",
      kind: "note",
      title: d.title,
      meta: "",
      details: d.details,
      link: d.linkUrl ? { label: d.linkLabel || "Open", href: d.linkUrl } : null,
      game: null,
    }));
  const events: Entry[] = guide.schedule
    .filter((s) => s.date === date)
    .map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      endTime: "",
      kind: s.type,
      title: scheduleTitle(s),
      meta: scheduleMeta(s),
      details: s.notes,
      link: s.mapUrl ? { label: "Directions", href: s.mapUrl } : null,
      game: s.type === "game" ? s : null,
    }));
  const meals: Entry[] = mealsFor(guide, date).map((m) => ({
    id: m.id,
    date: m.date,
    time: m.time,
    endTime: m.endTime,
    kind: "meal",
    title: m.meal,
    meta: mealMeta(m),
    details: m.notes,
    link: null,
    game: null,
  }));
  return [...notes, ...events, ...meals].sort(byTime);
}

export function tripDays(guide: Guide): string[] {
  const { startDate, endDate } = guide.event;
  const fromSchedule = [...guide.schedule.map((s) => s.date), ...guide.daily.map((d) => d.date)].sort();
  const start = startDate || fromSchedule[0];
  const end = endDate || fromSchedule[fromSchedule.length - 1];
  return start && end ? dateRange(start, end) : [];
}

/** The day Today opens on: today during the trip, else the first or last day. */
export function defaultDay(days: string[], today: string): string {
  if (!days.length) return today;
  if (today < days[0]) return days[0];
  if (today > days[days.length - 1]) return days[days.length - 1];
  return today;
}

export function isGameDay(guide: Guide, date: string): boolean {
  return guide.schedule.some((s) => s.date === date && s.type === "game");
}

/** The next game with a set start time that hasn't started yet. */
export function nextGame(guide: Guide, nowMs: number): { game: Row<"schedule">; at: Date } | null {
  let best: { game: Row<"schedule">; at: Date } | null = null;
  for (const s of guide.schedule) {
    if (s.type !== "game" || !s.time) continue;
    const at = zonedToUtc(s.date, s.time, guide.event.timeZone);
    if (at.getTime() <= nowMs) continue;
    if (!best || at < best.at) best = { game: s, at };
  }
  return best;
}
