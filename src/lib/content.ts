import { createHash } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_DAYS, VIEW_COOKIE, verifySession } from "./auth";
import {
  ACCESS_KEY,
  accessSchema,
  APP_SCOPE,
  emptySection,
  FIRST_TOURNAMENT,
  LIVE_KEY,
  liveSchema,
  SECTION_KEYS,
  sectionSchemas,
  type Access,
  type Guide,
  type SectionKey,
} from "./schema";
import { SEED } from "./seed";
import { getStore, type StoredSection } from "./store";

export interface SectionMeta {
  /** 0 until the section is first saved; the editor sends it back to detect clashes. */
  version: number;
  updatedAt: string | null;
}

export interface LoadedGuide {
  /** The tournament this is. */
  id: string;
  guide: Guide;
  meta: Record<SectionKey, SectionMeta>;
  /** Most recent save across all sections, for the "Updated …" line. */
  lastUpdated: string | null;
  access: { passcode: string; version: number; stored: Access | null; storedVersion: number };
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  live: boolean;
}

const TAG = "guide";
// Each deployment keeps its own cached copy, and different databases (production, a test
// database, local files) never share one.
const SOURCE = createHash("sha256")
  .update(process.env.DATABASE_URL ?? `files:${process.env.GUIDE_DATA_DIR ?? ""}`)
  .update(process.env.VERCEL_DEPLOYMENT_ID ?? "")
  .digest("hex")
  .slice(0, 16);

type Rows = Array<[string, StoredSection]>;
const fromStore = {
  scope: async (scope: string): Promise<Rows> => [...(await getStore().readScope(scope))],
  events: async (): Promise<Rows> => [...(await getStore().readEverywhere("event"))],
};
// Saved content is kept between requests so most page loads don't touch the database (and a
// sleeping one isn't woken). Every save clears it; the hour is only a safety net. Preview
// deployments share the production database but don't hear about its saves, so they always
// read it directly.
const keep = process.env.VERCEL_ENV !== "preview";
const kept = { tags: [TAG], revalidate: 3600 };
const readScope = keep ? unstable_cache(fromStore.scope, ["guide-scope-v2", SOURCE], kept) : fromStore.scope;
const readEvents = keep ? unstable_cache(fromStore.events, ["guide-events-v2", SOURCE], kept) : fromStore.events;

/** Call after every save, so the next page load shows it. */
export function contentChanged(): void {
  revalidateTag(TAG, { expire: 0 });
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** What a section shows before it is first saved: the starting content for the first tournament, else empty. */
function unsaved<K extends SectionKey>(tournament: string, key: K): Guide[K] {
  return tournament === FIRST_TOURNAMENT ? clone(SEED[key]) : emptySection(key);
}

/** Every tournament, newest first, and which one players see. */
export const loadTournaments = cache(async (): Promise<{ liveId: string; list: Tournament[] }> => {
  const [events, app] = await Promise.all([readEvents(), readScope(APP_SCOPE)]);
  const byId = new Map<string, Guide["event"]>();
  for (const [id, row] of events) {
    const parsed = sectionSchemas.event.safeParse(row.data);
    byId.set(id, parsed.success ? parsed.data : unsaved(id, "event"));
  }
  if (!byId.has(FIRST_TOURNAMENT)) byId.set(FIRST_TOURNAMENT, unsaved(FIRST_TOURNAMENT, "event"));

  const live = liveSchema.safeParse(new Map(app).get(LIVE_KEY)?.data);
  const liveId = live.success && byId.has(live.data.id) ? live.data.id : FIRST_TOURNAMENT;
  const list = [...byId]
    .map(([id, e]) => ({
      id,
      name: e.eventName || "Untitled tournament",
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      timeZone: e.timeZone,
      live: id === liveId,
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name));
  return { liveId, list };
});

/** One tournament's guide. Loaded once per request. */
export const loadTournament = cache(async (id: string): Promise<LoadedGuide> => {
  const rows = new Map(await readScope(id));
  const guide = {} as Record<SectionKey, unknown>;
  const meta = {} as Record<SectionKey, SectionMeta>;
  let lastUpdated: string | null = null;

  for (const key of SECTION_KEYS) {
    const row = rows.get(key);
    if (!row) {
      guide[key] = unsaved(id, key);
      meta[key] = { version: 0, updatedAt: null };
      continue;
    }
    const parsed = sectionSchemas[key].safeParse(row.data);
    if (parsed.success) {
      guide[key] = parsed.data;
    } else {
      console.error(`Stored "${key}" section of ${id} no longer matches its schema; showing it as if never saved.`, parsed.error.issues);
      guide[key] = unsaved(id, key);
    }
    meta[key] = { version: row.version, updatedAt: row.updatedAt };
    if (!lastUpdated || row.updatedAt > lastUpdated) lastUpdated = row.updatedAt;
  }

  const accessRow = rows.get(ACCESS_KEY);
  const stored = accessRow ? accessSchema.safeParse(accessRow.data) : null;
  const storedAccess = stored?.success ? stored.data : null;
  // VIEWER_PASSWORD is only the first tournament's starting passcode; later ones are created with their own.
  const fallback = id === FIRST_TOURNAMENT ? (process.env.VIEWER_PASSWORD ?? "") : "";

  return {
    id,
    guide: guide as Guide,
    meta,
    lastUpdated,
    access: {
      passcode: storedAccess?.passcode ?? fallback,
      version: storedAccess?.version ?? 0,
      stored: storedAccess,
      storedVersion: accessRow?.version ?? 0,
    },
  };
});

/**
 * The tournament this request shows: the live one, or for staff, the one they picked to work on.
 * Only checks the login's signature: being staff doesn't depend on anything in the database.
 */
export const activeTournamentId = cache(async (): Promise<string> => {
  const { liveId, list } = await loadTournaments();
  const jar = await cookies();
  const picked = jar.get(VIEW_COOKIE)?.value;
  if (!picked || picked === liveId || !list.some((t) => t.id === picked)) return liveId;
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  return session?.role === "admin" ? picked : liveId;
});

/** The guide this request shows (see activeTournamentId). */
export const loadGuide = cache(async (): Promise<LoadedGuide> => loadTournament(await activeTournamentId()));

/** The guide players see. */
export const loadLiveGuide = cache(async (): Promise<LoadedGuide> => loadTournament((await loadTournaments()).liveId));

/**
 * The tournament a staff save names, if it exists. Editors send the tournament they were opened
 * on, so switching tournaments in another tab can't redirect a save; a request naming none means
 * the one the staff member is working on.
 */
export async function requestedTournament(value: unknown): Promise<string | null> {
  if (value === undefined) return activeTournamentId();
  if (typeof value !== "string") return null;
  const { list } = await loadTournaments();
  return list.some((t) => t.id === value) ? value : null;
}

/** Cookie settings for VIEW_COOKIE. */
export function viewCookie(req: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
