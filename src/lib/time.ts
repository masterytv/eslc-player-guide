// Every date and time in the guide is local to the tournament, in Spain.
export const TZ = "Europe/Madrid";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isDate(v: string): boolean {
  const m = DATE_RE.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function isTime(v: string): boolean {
  return TIME_RE.test(v);
}

/** "14:30" → 870 minutes after midnight, or null for a blank/invalid time. */
export function toMinutes(t: string): number | null {
  const m = TIME_RE.exec(t);
  return m ? +m[1] * 60 + +m[2] : null;
}

/** The current date and minute in the tournament's time zone. */
export function zonedNow(now: Date = new Date(), tz: string = TZ): { date: string; minutes: number } {
  const p = parts(now, tz);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
}

function parts(at: Date, tz: string) {
  const out: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)) {
    out[type] = value;
  }
  return out as { year: string; month: string; day: string; hour: string; minute: string; second: string };
}

/** Converts a wall-clock date and time in `tz` to the absolute instant. */
export function zonedToUtc(date: string, time: string, tz: string = TZ): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = (time || "00:00").split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (instant: number) => {
    const p = parts(new Date(instant), tz);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instant;
  };
  let guess = wall - offsetAt(wall);
  // A second pass settles the offset when the first guess crossed a DST change.
  guess = wall - offsetAt(guess);
  return new Date(guess);
}

function utcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function dayParts(date: string): { dow: string; day: number; month: string } {
  const d = utcDate(date);
  return {
    dow: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
  };
}

/** "Mon 2 Nov" */
export function dayLabel(date: string): string {
  if (!isDate(date)) return date;
  const p = dayParts(date);
  return `${p.dow} ${p.day} ${p.month}`;
}

/** "31 Oct – 9 Nov" */
export function rangeLabel(start: string, end: string): string {
  if (!isDate(start) || !isDate(end)) return "";
  const a = dayParts(start);
  const b = dayParts(end);
  return a.month === b.month ? `${a.day}–${b.day} ${b.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

export function addDays(date: string, n: number): string {
  const d = utcDate(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / 86_400_000);
}

/** Every date from start to end inclusive, capped so a typo can't produce a huge list. */
export function dateRange(start: string, end: string, cap = 60): string[] {
  if (!isDate(start) || !isDate(end) || end < start) return isDate(start) ? [start] : [];
  const out: string[] = [];
  for (let d = start; d <= end && out.length < cap; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "14:30" → { hm: "2:30", ap: "PM" } */
export function clock(t: string): { hm: string; ap: string } | null {
  const mins = toMinutes(t);
  if (mins == null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { hm: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, ap: h >= 12 ? "PM" : "AM" };
}

/** "14:30" → "2:30 PM", "" → fallback */
export function clockLabel(t: string, fallback = "TBC"): string {
  const c = clock(t);
  return c ? `${c.hm} ${c.ap}` : fallback;
}

/** Whole-minute countdown text: "3 h 10 min", "25 min", "2 days". */
export function countdown(fromMs: number, toMs: number): string {
  const mins = Math.max(0, Math.round((toMs - fromMs) / 60_000));
  if (mins < 60) return `${mins} min`;
  if (mins < 24 * 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const days = Math.round(mins / (24 * 60));
  return days === 1 ? "1 day" : `${days} days`;
}

/** "just now", "4 min ago", "3 h ago", "2 days ago" */
export function ago(iso: string | null, nowMs: number): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}
