import { promises as fs } from "node:fs";
import path from "node:path";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";
import { FIRST_TOURNAMENT } from "./schema";

// Where the guide's content lives:
//   DATABASE_URL set      → Postgres (Neon on Vercel)
//   on Vercel without one → read-only: the app shows the starting content and
//                           saving explains what to set up
//   locally without one   → JSON files in ./.data, so the app runs with no setup

export interface StoredSection {
  data: unknown;
  version: number;
  updatedAt: string;
}

export type WriteResult = { ok: true; version: number; updatedAt: string } | { ok: false; reason: "conflict" };

/** Pass as expectedVersion to overwrite whatever is stored. */
export const FORCE = -1;

// Each entry belongs to a scope: a tournament's id, or APP_SCOPE for the app's own settings.
// Entries are stored as "<scope>/<key>", except that the first tournament's keep the plain keys
// they had before tournaments existed, so nothing had to move and older code still reads them.

export function storageKey(scope: string, key: string): string {
  return scope === FIRST_TOURNAMENT ? key : `${scope}/${key}`;
}

export function splitKey(stored: string): { scope: string; key: string } {
  const i = stored.indexOf("/");
  return i < 0 ? { scope: FIRST_TOURNAMENT, key: stored } : { scope: stored.slice(0, i), key: stored.slice(i + 1) };
}

export interface Store {
  readonly kind: "postgres" | "file" | "readonly";
  /** Everything saved in one scope, by key. */
  readScope(scope: string): Promise<Map<string, StoredSection>>;
  /** One key from every scope that has it, by scope: e.g. each tournament's "event" section. */
  readEverywhere(key: string): Promise<Map<string, StoredSection>>;
  /** Saves only if the stored version still equals expectedVersion (0 = never saved). */
  write(scope: string, key: string, data: unknown, expectedVersion: number): Promise<WriteResult>;
  /** Saves a new scope's entries all at once. False if anything is saved in that scope already. */
  create(scope: string, entries: Record<string, unknown>): Promise<boolean>;
  putImage(id: string, mime: string, bytes: Buffer): Promise<void>;
  getImage(id: string): Promise<{ mime: string; bytes: Buffer } | null>;
}

export class StorageNotConfigured extends Error {
  constructor() {
    super("Saving needs a database. Add the Neon integration in Vercel (Storage → Neon) so DATABASE_URL is set, then redeploy.");
  }
}

/* ---------- Postgres ---------- */

const globalForPg = globalThis as unknown as { guidePool?: Pool; guideSchema?: Promise<void> };

/**
 * node-postgres already treats Neon's "sslmode=require" as full certificate
 * checking; saying so explicitly stops it logging a warning on every cold start.
 */
export function withExplicitSsl(url: string | undefined): string | undefined {
  return url?.replace(/([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/, "$1verify-full");
}

function pool(): Pool {
  if (!globalForPg.guidePool) {
    const p = new Pool({ connectionString: withExplicitSsl(process.env.DATABASE_URL), max: 3, idleTimeoutMillis: 5_000 });
    // The database closing an idle connection is reported here instead of crashing the function.
    p.on("error", (err) => console.warn("Idle database connection closed:", err.message));
    // On Vercel, closes idle connections before the function is suspended. Does nothing elsewhere.
    attachDatabasePool(p);
    globalForPg.guidePool = p;
  }
  return globalForPg.guidePool;
}

const DROPPED = /Connection terminated|ECONNRESET|EPIPE|connection error|terminating connection/i;

export function isDroppedConnection(err: unknown): boolean {
  return err instanceof Error && (DROPPED.test(err.message) || (err as { code?: string }).code === "57P01");
}

/**
 * Runs once more on a fresh connection when the first try finds its connection
 * already closed. Safe for writes too: a versioned save that did land the first
 * time comes back as a clash rather than saving twice, and a repeated photo
 * insert is ignored.
 */
export async function retryDropped<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isDroppedConnection(err)) throw err;
    return run();
  }
}

function query<R extends QueryResultRow>(text: string, values?: unknown[]) {
  return retryDropped(() => pool().query<R>(text, values));
}

async function ensureSchema(): Promise<void> {
  globalForPg.guideSchema ??= (async () => {
    const sql = `
      create table if not exists guide_section (
        key text primary key,
        data jsonb not null,
        version integer not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists guide_image (
        id text primary key,
        mime text not null,
        bytes bytea not null,
        created_at timestamptz not null default now()
      );`;
    try {
      await query(sql);
    } catch {
      // Two cold starts creating the tables at once can collide; the second try sees them.
      await query(sql);
    }
  })().catch((err) => {
    globalForPg.guideSchema = undefined;
    throw err;
  });
  return globalForPg.guideSchema;
}

type SectionRow = { key: string; data: unknown; version: number; updated_at: Date };
const stored = (r: SectionRow): StoredSection => ({ data: r.data, version: r.version, updatedAt: r.updated_at.toISOString() });

const postgresStore: Store = {
  kind: "postgres",
  async readScope(scope) {
    await ensureSchema();
    const res =
      scope === FIRST_TOURNAMENT
        ? await query<SectionRow>("select key, data, version, updated_at from guide_section where position('/' in key) = 0")
        : await query<SectionRow>(
            "select key, data, version, updated_at from guide_section where left(key, char_length($1) + 1) = $1 || '/'",
            [scope],
          );
    return new Map(res.rows.map((r) => [splitKey(r.key).key, stored(r)]));
  },
  async readEverywhere(key) {
    await ensureSchema();
    const res = await query<SectionRow>(
      `select key, data, version, updated_at from guide_section
       where key = $1 or (position('/' in key) > 0 and substr(key, position('/' in key) + 1) = $1)`,
      [key],
    );
    return new Map(res.rows.map((r) => [splitKey(r.key).scope, stored(r)]));
  },
  async write(scope, plainKey, data, expectedVersion) {
    await ensureSchema();
    const key = storageKey(scope, plainKey);
    const json = JSON.stringify(data);
    let res;
    if (expectedVersion === FORCE) {
      res = await query<{ version: number; updated_at: Date }>(
        `insert into guide_section (key, data, version) values ($1, $2, 1)
         on conflict (key) do update set data = excluded.data, version = guide_section.version + 1, updated_at = now()
         returning version, updated_at`,
        [key, json],
      );
    } else if (expectedVersion === 0) {
      res = await query<{ version: number; updated_at: Date }>(
        `insert into guide_section (key, data, version) values ($1, $2, 1)
         on conflict (key) do nothing returning version, updated_at`,
        [key, json],
      );
    } else {
      res = await query<{ version: number; updated_at: Date }>(
        `update guide_section set data = $2, version = version + 1, updated_at = now()
         where key = $1 and version = $3 returning version, updated_at`,
        [key, json, expectedVersion],
      );
    }
    const row = res.rows[0];
    return row ? { ok: true, version: row.version, updatedAt: row.updated_at.toISOString() } : { ok: false, reason: "conflict" };
  },
  async create(scope, entries) {
    if (scope === FIRST_TOURNAMENT) throw new Error("The first tournament always exists.");
    await ensureSchema();
    try {
      // One statement, so it saves everything or nothing.
      const res = await query(
        `insert into guide_section (key, data, version)
         select $1 || '/' || e.key, e.value, 1 from jsonb_each($2::jsonb) e
         where not exists (select 1 from guide_section where left(key, char_length($1) + 1) = $1 || '/')`,
        [scope, JSON.stringify(entries)],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      // Someone else created the same scope at the same moment.
      if ((err as { code?: string }).code === "23505") return false;
      throw err;
    }
  },
  async putImage(id, mime, bytes) {
    await ensureSchema();
    await query("insert into guide_image (id, mime, bytes) values ($1, $2, $3) on conflict (id) do nothing", [id, mime, bytes]);
  },
  async getImage(id) {
    await ensureSchema();
    const res = await query<{ mime: string; bytes: Buffer }>("select mime, bytes from guide_image where id = $1", [id]);
    return res.rows[0] ?? null;
  },
};

/* ---------- local files ---------- */

const dataDir = () => process.env.GUIDE_DATA_DIR || path.join(process.cwd(), ".data");
const sectionsFile = () => path.join(dataDir(), "sections.json");
let fileLock: Promise<unknown> = Promise.resolve();

async function readFileSections(): Promise<Record<string, StoredSection>> {
  try {
    return JSON.parse(await fs.readFile(sectionsFile(), "utf8"));
  } catch {
    return {};
  }
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function writeFileSections(all: Record<string, StoredSection>): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${sectionsFile()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(all, null, 2));
  await fs.rename(tmp, sectionsFile());
}

/** Runs file changes one at a time. */
function locked<T>(change: () => Promise<T>): Promise<T> {
  const run = fileLock.then(change);
  fileLock = run.catch(() => undefined);
  return run;
}

const fileStore: Store = {
  kind: "file",
  async readScope(scope) {
    const out = new Map<string, StoredSection>();
    for (const [stored, row] of Object.entries(await readFileSections())) {
      const k = splitKey(stored);
      if (k.scope === scope) out.set(k.key, row);
    }
    return out;
  },
  async readEverywhere(key) {
    const out = new Map<string, StoredSection>();
    for (const [stored, row] of Object.entries(await readFileSections())) {
      const k = splitKey(stored);
      if (k.key === key) out.set(k.scope, row);
    }
    return out;
  },
  write(scope, plainKey, data, expectedVersion) {
    return locked(async (): Promise<WriteResult> => {
      const key = storageKey(scope, plainKey);
      const all = await readFileSections();
      const current = all[key]?.version ?? 0;
      if (expectedVersion !== FORCE && current !== expectedVersion) return { ok: false, reason: "conflict" };
      const next = { data, version: current + 1, updatedAt: new Date().toISOString() };
      all[key] = next;
      await writeFileSections(all);
      return { ok: true, version: next.version, updatedAt: next.updatedAt };
    });
  },
  create(scope, entries) {
    if (scope === FIRST_TOURNAMENT) throw new Error("The first tournament always exists.");
    return locked(async () => {
      const all = await readFileSections();
      if (Object.keys(all).some((k) => splitKey(k).scope === scope)) return false;
      const updatedAt = new Date().toISOString();
      for (const [key, data] of Object.entries(entries)) all[storageKey(scope, key)] = { data, version: 1, updatedAt };
      await writeFileSections(all);
      return true;
    });
  },
  async putImage(id, mime, bytes) {
    const dir = path.join(dataDir(), "images");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${id}.${EXT[mime] ?? "bin"}`), bytes);
  },
  async getImage(id) {
    const dir = path.join(dataDir(), "images");
    for (const [mime, ext] of Object.entries(EXT)) {
      try {
        return { mime, bytes: await fs.readFile(path.join(dir, `${id}.${ext}`)) };
      } catch {
        // try the next extension
      }
    }
    return null;
  },
};

/* ---------- read-only (deployed without a database) ---------- */

const readonlyStore: Store = {
  kind: "readonly",
  async readScope() {
    return new Map();
  },
  async readEverywhere() {
    return new Map();
  },
  async write() {
    throw new StorageNotConfigured();
  },
  async create() {
    throw new StorageNotConfigured();
  },
  async putImage() {
    throw new StorageNotConfigured();
  },
  async getImage() {
    return null;
  },
};

export function getStore(): Store {
  if (process.env.DATABASE_URL) return postgresStore;
  if (process.env.VERCEL) return readonlyStore;
  return fileStore;
}
