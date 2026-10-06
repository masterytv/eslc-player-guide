import { z } from "zod";
import { ACCESS_KEY, emptySection, SECTION_KEYS, slugify, type Guide, type SectionKey } from "./schema";
import { isDate, isTimeZone } from "./time";

// Starting the next tournament: what staff fill in, and the content it begins with.

const sectionKey = z.enum(SECTION_KEYS as [SectionKey, ...SectionKey[]]);

export const newTournamentSchema = z
  .object({
    name: z.string().trim().min(1, "Add the tournament's name").max(80, "Keep this under 80 characters"),
    location: z.string().trim().max(120, "Keep this under 120 characters").default(""),
    startDate: z.string().trim().refine(isDate, "Pick the first day"),
    endDate: z.string().trim().refine(isDate, "Pick the last day"),
    timeZone: z.string().trim().refine(isTimeZone, "Pick the time zone"),
    passcode: z
      .string()
      .trim()
      .min(4, "Use at least 4 characters. A couple of words is easy to share and hard to guess.")
      .max(64, "Keep the passcode under 64 characters"),
    copyFrom: z.string().trim().min(1, "Pick a tournament to start from"),
    carry: z.array(sectionKey).max(SECTION_KEYS.length).default([]),
  })
  .refine((v) => !isDate(v.startDate) || !isDate(v.endDate) || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "The last day can't be before the first",
  });
export type NewTournament = z.output<typeof newTournamentSchema>;

/** A short id for web addresses and storage, unique among `taken`: "World Sixes 2027" → "world-sixes-2027". */
export function tournamentId(name: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(name).slice(0, 40).replace(/-+$/, "") || "tournament";
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
}

const freshId = () => crypto.randomUUID().slice(0, 12);

/**
 * Everything the new tournament is saved with: the sections staff chose to carry over (their items
 * get new ids, so calendar entries and packing ticks start afresh), the rest empty, and its passcode.
 */
export function startingContent(source: Guide, input: NewTournament, newId: () => string = freshId): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SECTION_KEYS) {
    if (key === "event") continue;
    if (!input.carry.includes(key)) {
      out[key] = emptySection(key);
      continue;
    }
    const data = structuredClone(source[key]);
    out[key] = Array.isArray(data) ? data.map((row) => ({ ...row, id: newId() })) : data;
  }
  out.event = {
    ...emptySection("event"),
    team: source.event.team,
    guideTitle: source.event.guideTitle,
    eventName: input.name,
    location: input.location,
    startDate: input.startDate,
    endDate: input.endDate,
    timeZone: input.timeZone,
  };
  out[ACCESS_KEY] = { passcode: input.passcode, version: 1 };
  return out;
}
