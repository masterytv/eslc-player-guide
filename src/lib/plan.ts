import type { Guide, Row, ScheduleType } from "./schema";
import { clockLabel, dateRange, toMinutes, zonedToUtc } from "./time";

export const TYPE_LABEL: Record<ScheduleType | "note", string> = {
  game: "Pool play",
  practice: "Practice",
  ceremony: "Ceremony",
  meeting: "Meeting",
  other: "Event",
  note: "Note",
};

export interface Entry {
  id: string;
  date: string;
  time: string;
  kind: ScheduleType | "note";
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

export function scheduleMeta(row: Row<"schedule">): string {
  if (row.type === "game") {
    return [row.round, row.field, row.warmup ? `Warm-up ${clockLabel(row.warmup)}` : "Warm-up TBC"].filter(Boolean).join(" · ");
  }
  return row.field ? (/^field/i.test(row.field) ? row.field : `Field ${row.field}`) : "";
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

/** Daily notes and schedule items for one day, in time order. */
export function entriesFor(guide: Guide, date: string): Entry[] {
  const notes: Entry[] = guide.daily
    .filter((d) => d.date === date)
    .map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
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
      kind: s.type,
      title: scheduleTitle(s),
      meta: scheduleMeta(s),
      details: s.notes,
      link: null,
      game: s.type === "game" ? s : null,
    }));
  return [...notes, ...events].sort(byTime);
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
    const at = zonedToUtc(s.date, s.time);
    if (at.getTime() <= nowMs) continue;
    if (!best || at < best.at) best = { game: s, at };
  }
  return best;
}
