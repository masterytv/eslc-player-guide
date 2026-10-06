import { z } from "zod";
import { DEFAULT_TZ, isDate, isTime, isTimeZone } from "./time";

// One schema per editable section of the guide. Stored data is parsed through
// these on every read, so a field added later simply takes its default.

const text = (max = 200) => z.string().trim().max(max, `Keep this under ${max} characters`).default("");
const req = (message: string, max = 200) =>
  z.string().trim().min(1, message).max(max, `Keep this under ${max} characters`);
const long = (max = 4000) => z.string().max(max, `Keep this under ${max} characters`).default("");
const lines = (maxItems = 100, maxLen = 300) =>
  z
    .array(z.string().max(maxLen, `Keep each line under ${maxLen} characters`))
    .max(maxItems, `Keep this to ${maxItems} lines`)
    .default([])
    .transform((rows) => rows.map((r) => r.trim()).filter(Boolean));
const date = z.string().trim().refine((v) => v === "" || isDate(v), "Pick a date").default("");
const dateReq = z.string().trim().refine(isDate, "Pick a date");
const time = z.string().trim().refine((v) => v === "" || isTime(v), "Pick a time, or leave it blank").default("");
// Full web links, or paths inside the app ("/venue#getting"). "//host" is not a path.
const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v) || /^\/(?!\/)\S*$/.test(v) || /^#[\w-]+$/.test(v);
const url = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || isLink(v), "Links start with https://")
  .default("");
const urlReq = z.string().trim().max(1000).refine(isLink, "Links start with https://");
const isImage = (v: string) => /^\/(img|seed)\/[\w.-]+$/.test(v) || /^https:\/\/\S+$/i.test(v);
const imageReq = z.string().trim().refine(isImage, "Add a photo");
const bool = (d = false) => z.boolean().default(d);
const id = z
  .string()
  .trim()
  .regex(/^[\w-]{1,64}$/, "Invalid item id");
const slug = z
  .string()
  .trim()
  .max(60)
  .refine((v) => v === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and dashes")
  .default("");

function list<T extends z.ZodRawShape>(shape: T, max = 400) {
  return z.array(z.object({ id, ...shape })).max(max, `Keep this to ${max} items`);
}

export const SCHEDULE_TYPES = ["game", "practice", "ceremony", "meeting", "other"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const sectionSchemas = {
  event: z.object({
    team: text(80),
    eventName: text(80),
    guideTitle: text(80),
    location: text(120),
    startDate: date,
    endDate: date,
    timeZone: z.string().trim().refine(isTimeZone, "Pick the tournament's time zone").default(DEFAULT_TZ),
    poolName: text(80),
    scheduleUrl: url,
    alert: long(600),
  }),
  daily: list({
    date: dateReq,
    time,
    title: req("Add what's happening", 140),
    details: long(1500),
    linkLabel: text(60),
    linkUrl: url,
  }),
  schedule: list({
    date: dateReq,
    time,
    type: z.enum(SCHEDULE_TYPES).default("game"),
    title: text(100),
    opponent: text(60),
    opponentCode: text(4).transform((v) => v.toUpperCase()),
    round: text(40),
    field: text(40),
    warmup: time,
    notes: long(500),
  }),
  staff: list({
    name: req("Add a name", 80),
    role: text(80),
    phone: text(30),
    whatsapp: bool(true),
    email: text(120),
  }),
  roster: list({
    number: text(4),
    firstName: req("Add a first name", 60),
    lastName: text(60),
    position: text(40),
  }),
  rooming: list({
    villa: req("Add the villa name", 60),
    names: lines(8, 80),
  }),
  meals: list({
    meal: req("Add the meal", 60),
    time: text(60),
    place: text(120),
    notes: long(400),
  }),
  travel: z.object({
    busDate: date,
    busTime: time,
    busHeadline: text(120),
    busText: long(1500),
    flightTitle: text(100),
    flightText: long(1000),
    flightFormUrl: url,
    flightResponsesUrl: url,
    ridesTitle: text(100),
    ridesLinkLabel: text(80),
    ridesLinkUrl: url,
  }),
  rides: list({
    name: req("Add a name", 80),
    summary: text(120),
    details: long(1200),
  }),
  accommodation: z.object({
    name: text(120),
    address: text(200),
    dates: text(80),
    villaName: text(120),
    villaDetails: text(160),
    villaNote: text(160),
    amenities: lines(40, 80),
  }),
  venue: z.object({
    name: text(120),
    address: text(200),
    walkNote: long(500),
    amenities: lines(40, 80),
    notes: lines(20, 300),
  }),
  maps: list({
    title: req("Add a title", 80),
    image: imageReq,
    placement: z.enum(["villas", "fields", "other"]).default("other"),
  }),
  packing: list({
    category: req("Add a category", 60),
    item: req("Add the item", 140),
    must: bool(),
  }),
  packingNotes: list({
    category: text(60),
    level: z.enum(["info", "warning"]).default("info"),
    text: req("Add the note", 600),
  }),
  packingInfo: z.object({
    suppliedTitle: text(100),
    supplied: lines(60, 100),
  }),
  pages: list({
    title: req("Add a title", 80),
    slug,
    group: z.enum(["before", "team"]).default("team"),
    summary: text(120),
    body: long(12000),
  }),
  anthem: z.object({
    title: text(80),
    requirement: text(160),
    intro: long(1500),
    videoUrl: url,
    videoLabel: text(80),
    lines: lines(40, 120),
    credit: text(200),
  }),
  links: list({
    label: req("Add a label", 80),
    url: urlReq,
    note: text(120),
  }),
};

export type SectionKey = keyof typeof sectionSchemas;
export const SECTION_KEYS = Object.keys(sectionSchemas) as SectionKey[];
export type Guide = { [K in SectionKey]: z.output<(typeof sectionSchemas)[K]> };
export type Row<K extends SectionKey> = Guide[K] extends Array<infer R> ? R : never;

/** A section with nothing in it yet: an empty list, or every field blank. */
export function emptySection<K extends SectionKey>(key: K): Guide[K] {
  const schema = sectionSchemas[key];
  return schema.parse(schema instanceof z.ZodArray ? [] : {}) as Guide[K];
}

export function isSectionKey(v: string): v is SectionKey {
  return Object.prototype.hasOwnProperty.call(sectionSchemas, v);
}

export function slugify(v: string): string {
  return v
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

// Slugs that would collide with the app's own routes under /more.
const RESERVED_SLUGS = new Set(["packing", "anthem", "links"]);

/** Fixes up data after validation: unique ids, page slugs. */
export function normalizeSection<K extends SectionKey>(key: K, data: Guide[K]): Guide[K] {
  if (Array.isArray(data)) {
    const seen = new Set<string>();
    for (const row of data as Array<{ id: string }>) {
      let rid = row.id;
      while (seen.has(rid)) rid = `${row.id}-${Math.random().toString(36).slice(2, 6)}`;
      row.id = rid;
      seen.add(rid);
    }
  }
  if (key === "pages") {
    const used = new Set<string>();
    for (const page of data as Guide["pages"]) {
      const base = page.slug || slugify(page.title) || "page";
      let s = RESERVED_SLUGS.has(base) ? `${base}-page` : base;
      for (let n = 2; used.has(s); n++) s = `${base}-${n}`;
      page.slug = s;
      used.add(s);
    }
  }
  return data;
}

/** Validation issue paths as dot strings ("3.title"), for the editor to place messages. */
export function issuesOf(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

export const accessSchema = z.object({
  passcode: z.string().min(1),
  version: z.number().int().min(0),
});
export type Access = z.infer<typeof accessSchema>;
/** Each tournament's team passcode is saved alongside its sections under this key. */
export const ACCESS_KEY = "_access";

/** Content saved before the guide had tournaments belongs to this one. */
export const FIRST_TOURNAMENT = "eslc-2026";
/** Where the app's own settings are saved, beside the tournaments. */
export const APP_SCOPE = "_app";
/** The app setting naming the tournament players see. */
export const LIVE_KEY = "live";
export const liveSchema = z.object({ id: z.string() });
export const TOURNAMENT_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
