import { scheduleTitle } from "./plan";
import type { Guide, Row } from "./schema";
import { addDays, zonedToUtc } from "./time";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds lines at 75 octets as the iCalendar format requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

function event(row: Row<"schedule">, guide: Guide, now: Date): string[] {
  const lines = ["BEGIN:VEVENT", `UID:${row.id}@eslc-player-guide`, `DTSTAMP:${stamp(now)}`];
  if (row.time) {
    const start = zonedToUtc(row.date, row.time, guide.event.timeZone);
    lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 60 * 60_000))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${row.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(row.date, 1).replace(/-/g, "")}`);
  }
  const title = [scheduleTitle(row), row.round].filter(Boolean).join(" \u00b7 ");
  const where = [row.field, guide.venue.name].filter(Boolean).join(", ");
  const notes = [row.warmup ? `Warm-up ${row.warmup}` : "", row.notes].filter(Boolean).join("\n");
  lines.push(`SUMMARY:${esc(title)}`);
  if (where) lines.push(`LOCATION:${esc(where)}`);
  if (notes) lines.push(`DESCRIPTION:${esc(notes)}`);
  lines.push("END:VEVENT");
  return lines;
}

export function calendar(rows: Row<"schedule">[], guide: Guide, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ireland Lacrosse//Player Guide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${guide.event.team} ${guide.event.eventName}`.trim())}`,
    ...rows.flatMap((r) => event(r, guide, now)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
