import { cache } from "react";
import { ACCESS_KEY, accessSchema, SECTION_KEYS, sectionSchemas, type Access, type Guide, type SectionKey } from "./schema";
import { SEED } from "./seed";
import { getStore } from "./store";

export interface SectionMeta {
  /** 0 until the section is first saved; the editor sends it back to detect clashes. */
  version: number;
  updatedAt: string | null;
}

export interface LoadedGuide {
  guide: Guide;
  meta: Record<SectionKey, SectionMeta>;
  /** Most recent save across all sections, for the "Updated …" line. */
  lastUpdated: string | null;
  access: { passcode: string; version: number; stored: Access | null; storedVersion: number };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Loads every section once per request. Sections never saved fall back to the starting content. */
export const loadGuide = cache(async (): Promise<LoadedGuide> => {
  const rows = await getStore().readAll();
  const guide = {} as Record<SectionKey, unknown>;
  const meta = {} as Record<SectionKey, SectionMeta>;
  let lastUpdated: string | null = null;

  for (const key of SECTION_KEYS) {
    const row = rows.get(key);
    if (!row) {
      guide[key] = clone(SEED[key]);
      meta[key] = { version: 0, updatedAt: null };
      continue;
    }
    const parsed = sectionSchemas[key].safeParse(row.data);
    if (parsed.success) {
      guide[key] = parsed.data;
    } else {
      console.error(`Stored "${key}" section no longer matches its schema; showing the starting content.`, parsed.error.issues);
      guide[key] = clone(SEED[key]);
    }
    meta[key] = { version: row.version, updatedAt: row.updatedAt };
    if (!lastUpdated || row.updatedAt > lastUpdated) lastUpdated = row.updatedAt;
  }

  const accessRow = rows.get(ACCESS_KEY);
  const stored = accessRow ? accessSchema.safeParse(accessRow.data) : null;
  const storedAccess = stored?.success ? stored.data : null;

  return {
    guide: guide as Guide,
    meta,
    lastUpdated,
    access: {
      passcode: storedAccess?.passcode ?? process.env.VIEWER_PASSWORD ?? "",
      version: storedAccess?.version ?? 0,
      stored: storedAccess,
      storedVersion: accessRow?.version ?? 0,
    },
  };
});
