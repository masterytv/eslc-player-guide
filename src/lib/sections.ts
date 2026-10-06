import type { Guide, SectionKey } from "./schema";
import { clockLabel, TIME_ZONES, timeZoneOption } from "./time";

// How each section appears in the admin editor. Client-safe: no server imports.

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "date"
  | "time"
  | "select"
  | "checkbox"
  | "lines"
  | "image"
  | "url"
  | "tel"
  | "email";

type AnyRow = Record<string, unknown>;

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  /** Hide the field unless this returns true for the current item. */
  showIf?: (row: AnyRow) => boolean;
}

export interface SectionDef {
  key: SectionKey;
  title: string;
  description: string;
  group: string;
  kind: "list" | "object";
  /** Where players see this section. */
  viewHref: string;
  fields: FieldDef[];
  /** "note", "game", "player"… used in "Add a note". */
  itemName?: string;
  /** One line describing an item when it's collapsed in the editor. */
  summary?: (row: AnyRow) => string;
  /** Items are listed by date in the app, so the editor filters by day instead of reordering. */
  byDate?: boolean;
  newItem?: () => AnyRow;
  /** Copied into the next tournament unless staff untick it (staff, packing list…). */
  carryOver?: boolean;
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const isGame = (row: AnyRow) => row.type === "game";
const notGame = (row: AnyRow) => row.type !== "game";
const join = (...parts: string[]) => parts.filter(Boolean).join(" · ");

export const GROUPS = ["Today & schedule", "Team", "Venue & stay", "More"] as const;

export const SECTIONS: SectionDef[] = [
  {
    key: "event",
    title: "Event & alert",
    description: "Event name, dates, time zone, and an alert banner on Today",
    group: "Today & schedule",
    kind: "object",
    viewHref: "/",
    fields: [
      { key: "alert", label: "Alert banner", type: "textarea", help: "Shows at the top of Today for everyone. Leave blank to hide it." },
      { key: "team", label: "Team", type: "text" },
      { key: "eventName", label: "Event", type: "text", placeholder: "ESLC 2026" },
      { key: "guideTitle", label: "Guide title", type: "text", placeholder: "Player Guide" },
      { key: "location", label: "Location", type: "text" },
      { key: "startDate", label: "First day", type: "date" },
      { key: "endDate", label: "Last day", type: "date", help: "Today's day strip runs from the first day to the last." },
      {
        key: "timeZone",
        label: "Time zone",
        type: "select",
        options: TIME_ZONES.map((z) => ({ value: z.id, label: timeZoneOption(z.id) })),
        help: "Where the tournament is. Every time in the guide is local time there.",
      },
      { key: "poolName", label: "Pool", type: "text", placeholder: "Pool play B" },
      { key: "scheduleUrl", label: "Full schedule link", type: "url", placeholder: "https://" },
    ],
  },
  {
    key: "daily",
    title: "Daily notes",
    description: "The plan for each day: buses, meals, meetings",
    group: "Today & schedule",
    kind: "list",
    viewHref: "/",
    itemName: "note",
    byDate: true,
    summary: (r) => join(clockLabel(s(r.time)), s(r.title) || "New note"),
    fields: [
      { key: "date", label: "Day", type: "date", required: true },
      { key: "time", label: "Time", type: "time", help: "Leave blank if the time isn't set yet. Players see TBC." },
      { key: "title", label: "What's happening", type: "text", required: true, placeholder: "Team breakfast" },
      { key: "details", label: "Details", type: "textarea" },
      { key: "linkLabel", label: "Button label", type: "text", placeholder: "Ride options", help: "Optional button under the note." },
      { key: "linkUrl", label: "Button link", type: "url", placeholder: "https:// or /venue#getting" },
    ],
  },
  {
    key: "schedule",
    title: "Schedule",
    description: "Games, practices, ceremonies and meetings",
    group: "Today & schedule",
    kind: "list",
    viewHref: "/schedule",
    itemName: "event",
    byDate: true,
    summary: (r) =>
      join(
        clockLabel(s(r.time), "TBD"),
        r.type === "game" ? `vs ${s(r.opponent) || "?"}` : s(r.title) || "New event",
        s(r.round),
      ),
    newItem: () => ({ type: "game" }),
    fields: [
      { key: "date", label: "Day", type: "date", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "game", label: "Game (pool play)" },
          { value: "practice", label: "Practice" },
          { value: "ceremony", label: "Ceremony" },
          { value: "meeting", label: "Team meeting" },
          { value: "other", label: "Other" },
        ],
      },
      { key: "time", label: "Start time", type: "time", help: "Leave blank while it's TBD." },
      { key: "opponent", label: "Opponent", type: "text", placeholder: "Finland", showIf: isGame },
      { key: "opponentCode", label: "Opponent code", type: "text", placeholder: "FIN", help: "Three letters, shown big on Today.", showIf: isGame },
      { key: "round", label: "Match", type: "text", placeholder: "Match 006", showIf: isGame },
      { key: "title", label: "Title", type: "text", placeholder: "Practice", showIf: notGame },
      { key: "field", label: "Field", type: "text", placeholder: "Field 2" },
      { key: "warmup", label: "Warm-up time", type: "time", showIf: isGame },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "staff",
    carryOver: true,
    title: "Staff",
    description: "Names, roles and phone numbers",
    group: "Team",
    kind: "list",
    viewHref: "/team",
    itemName: "person",
    summary: (r) => join(s(r.name) || "New person", s(r.role)),
    newItem: () => ({ whatsapp: true }),
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text", placeholder: "Head Coach" },
      { key: "phone", label: "Mobile", type: "tel", placeholder: "+1 315 555 0123", help: "Include the country code so Call and WhatsApp work abroad." },
      { key: "whatsapp", label: "Show a WhatsApp button", type: "checkbox" },
      { key: "email", label: "Email", type: "email" },
    ],
  },
  {
    key: "roster",
    carryOver: true,
    title: "Roster",
    description: "Players, numbers and positions",
    group: "Team",
    kind: "list",
    viewHref: "/team?view=roster",
    itemName: "player",
    summary: (r) => join(s(r.number) ? `#${s(r.number)}` : "", `${s(r.firstName)} ${s(r.lastName)}`.trim() || "New player", s(r.position)),
    fields: [
      { key: "number", label: "Number", type: "text", placeholder: "7" },
      { key: "firstName", label: "First name", type: "text", required: true },
      { key: "lastName", label: "Last name", type: "text" },
      { key: "position", label: "Position", type: "text", placeholder: "Attack" },
    ],
  },
  {
    key: "rooming",
    title: "Rooming list",
    description: "Who is in which villa",
    group: "Team",
    kind: "list",
    viewHref: "/team?view=rooms",
    itemName: "villa",
    summary: (r) => join(s(r.villa) || "New villa", Array.isArray(r.names) ? `${r.names.filter(Boolean).length} people` : ""),
    fields: [
      { key: "villa", label: "Villa", type: "text", required: true, placeholder: "Villa 12" },
      { key: "names", label: "Names", type: "lines", help: "One name per line." },
    ],
  },
  {
    key: "travel",
    title: "Airport bus & flights",
    description: "Team bus time and the flight details sheet",
    group: "Venue & stay",
    kind: "object",
    viewHref: "/venue#getting",
    fields: [
      { key: "busDate", label: "Bus day", type: "date" },
      { key: "busTime", label: "Bus leaves at", type: "time" },
      { key: "busHeadline", label: "Headline", type: "text" },
      { key: "busText", label: "Details", type: "textarea" },
      { key: "flightTitle", label: "Flight card title", type: "text" },
      { key: "flightText", label: "Flight card text", type: "textarea" },
      { key: "flightFormUrl", label: "Flight form link", type: "url", placeholder: "https://", help: "The “Add my flight” button. Hidden when blank." },
      { key: "flightResponsesUrl", label: "Responses link", type: "url", placeholder: "https://" },
      { key: "ridesTitle", label: "Ride options heading", type: "text" },
      { key: "ridesLinkLabel", label: "Taxi link label", type: "text" },
      { key: "ridesLinkUrl", label: "Taxi link", type: "url" },
    ],
  },
  {
    key: "rides",
    title: "Ride options",
    description: "Taxis and transfers if someone misses the bus",
    group: "Venue & stay",
    kind: "list",
    viewHref: "/venue#getting",
    itemName: "option",
    summary: (r) => s(r.name) || "New option",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "summary", label: "One-line summary", type: "text" },
      { key: "details", label: "Details", type: "textarea" },
    ],
  },
  {
    key: "accommodation",
    title: "Villas",
    description: "Resort, address and villa details",
    group: "Venue & stay",
    kind: "object",
    viewHref: "/venue#villas",
    fields: [
      { key: "name", label: "Resort", type: "text" },
      { key: "address", label: "Address", type: "text", help: "Used for the Open in Maps button." },
      { key: "dates", label: "Dates", type: "text", placeholder: "31 Oct – 10 Nov" },
      { key: "villaName", label: "Villa", type: "text" },
      { key: "villaDetails", label: "Villa details", type: "text", placeholder: "2 bedrooms · 1 bathroom" },
      { key: "villaNote", label: "Note", type: "text" },
      { key: "amenities", label: "Amenities", type: "lines", help: "One per line." },
    ],
  },
  {
    key: "venue",
    title: "Venue",
    description: "Fields, address, amenities",
    group: "Venue & stay",
    kind: "object",
    viewHref: "/venue#fields",
    fields: [
      { key: "name", label: "Venue", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "walkNote", label: "Getting there", type: "textarea", help: "Also shown on Today on game days." },
      { key: "amenities", label: "Amenities", type: "lines", help: "One per line." },
      { key: "notes", label: "Notes", type: "lines", help: "One per line." },
    ],
  },
  {
    key: "maps",
    title: "Maps & photos",
    description: "Resort map, villa layout, field map",
    group: "Venue & stay",
    kind: "list",
    viewHref: "/venue#villas",
    itemName: "map",
    summary: (r) => s(r.title) || "New map",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "image", label: "Photo", type: "image", required: true },
      {
        key: "placement",
        label: "Show under",
        type: "select",
        options: [
          { value: "villas", label: "Villas" },
          { value: "fields", label: "Fields" },
          { value: "other", label: "Other maps" },
        ],
      },
    ],
  },
  {
    key: "meals",
    title: "Meals",
    description: "Meal times and where to eat",
    group: "Venue & stay",
    kind: "list",
    viewHref: "/venue#meals",
    itemName: "meal",
    summary: (r) => join(s(r.meal) || "New meal", s(r.time), s(r.place)),
    fields: [
      { key: "meal", label: "Meal", type: "text", required: true, placeholder: "Breakfast" },
      { key: "time", label: "When", type: "text", placeholder: "8:00–9:30" },
      { key: "place", label: "Where", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "packing",
    carryOver: true,
    title: "Packing list",
    description: "Items players tick off before they travel",
    group: "More",
    kind: "list",
    viewHref: "/more/packing",
    itemName: "item",
    summary: (r) => join(s(r.category), s(r.item) || "New item"),
    fields: [
      { key: "category", label: "Category", type: "text", required: true, placeholder: "Equipment", help: "Items are grouped by category, in the order categories first appear." },
      { key: "item", label: "Item", type: "text", required: true },
      { key: "must", label: "Mark as a must-bring", type: "checkbox" },
    ],
  },
  {
    key: "packingNotes",
    carryOver: true,
    title: "Packing warnings",
    description: "Notes and warnings shown with the packing list",
    group: "More",
    kind: "list",
    viewHref: "/more/packing",
    itemName: "note",
    summary: (r) => join(r.level === "warning" ? "Warning" : "Note", s(r.category) || "Top of list"),
    newItem: () => ({ level: "info" }),
    fields: [
      { key: "category", label: "Show after category", type: "text", help: "Leave blank to show it at the top of the list." },
      {
        key: "level",
        label: "Style",
        type: "select",
        options: [
          { value: "info", label: "Note (grey)" },
          { value: "warning", label: "Warning (red)" },
        ],
      },
      { key: "text", label: "Text", type: "textarea", required: true },
    ],
  },
  {
    key: "packingInfo",
    carryOver: true,
    title: "Supplied kit",
    description: "What players get at training camp",
    group: "More",
    kind: "object",
    viewHref: "/more/packing",
    fields: [
      { key: "suppliedTitle", label: "Heading", type: "text" },
      { key: "supplied", label: "Items", type: "lines", help: "One per line." },
    ],
  },
  {
    key: "pages",
    carryOver: true,
    title: "Pages",
    description: "Conduct, tournament rules, activities, and any new page",
    group: "More",
    kind: "list",
    viewHref: "/more",
    itemName: "page",
    summary: (r) => s(r.title) || "New page",
    newItem: () => ({ group: "team" }),
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "summary", label: "Subtitle in the More menu", type: "text" },
      {
        key: "group",
        label: "Show under",
        type: "select",
        options: [
          { value: "before", label: "Before you go" },
          { value: "team", label: "Team" },
        ],
      },
      { key: "body", label: "Page text", type: "markdown" },
      { key: "slug", label: "Web address", type: "text", help: "Made from the title if blank, e.g. conduct → /more/conduct." },
    ],
  },
  {
    key: "anthem",
    carryOver: true,
    title: "Anthem",
    description: "Lyrics and video",
    group: "More",
    kind: "object",
    viewHref: "/more/anthem",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "requirement", label: "Requirement", type: "text" },
      { key: "intro", label: "Intro", type: "textarea" },
      { key: "videoUrl", label: "Video link", type: "url" },
      { key: "videoLabel", label: "Video button label", type: "text" },
      { key: "lines", label: "Lyrics", type: "lines", help: "One line of the anthem per line." },
      { key: "credit", label: "Credit", type: "text" },
    ],
  },
  {
    key: "links",
    carryOver: true,
    title: "Useful links",
    description: "Schedule, forms, taxis",
    group: "More",
    kind: "list",
    viewHref: "/more/links",
    itemName: "link",
    summary: (r) => s(r.label) || "New link",
    fields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "url", label: "Link", type: "url", required: true, placeholder: "https://" },
      { key: "note", label: "Small text under the label", type: "text" },
    ],
  },
];

export function sectionDef(key: string): SectionDef | undefined {
  return SECTIONS.find((d) => d.key === key);
}

export function countOf(guide: Guide, key: SectionKey): number | null {
  const v = guide[key];
  return Array.isArray(v) ? v.length : null;
}
