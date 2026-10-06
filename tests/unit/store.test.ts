import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { FORCE, getStore } from "../../src/lib/store.ts";

// Runs against local files, and also against Postgres when TEST_DATABASE_URL is set.
const targets: Array<{ name: string; env: Record<string, string | undefined> }> = [{ name: "files", env: { DATABASE_URL: undefined } }];
if (process.env.TEST_DATABASE_URL) targets.push({ name: "postgres", env: { DATABASE_URL: process.env.TEST_DATABASE_URL } });

let dir = "";
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "guide-store-"));
  process.env.GUIDE_DATA_DIR = dir;
  delete process.env.VERCEL;
});
after(() => rmSync(dir, { recursive: true, force: true }));

for (const target of targets) {
  test(`${target.name}: saves with version checks so two editors can't silently overwrite each other`, async () => {
    for (const [k, v] of Object.entries(target.env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    const store = getStore();
    const key = `test-${target.name}-${Date.now()}`;

    const first = await store.write(key, { n: 1 }, 0);
    assert.ok(first.ok && first.version === 1);
    // A second "first save" (version 0) loses: someone already saved.
    assert.deepEqual(await store.write(key, { n: 2 }, 0), { ok: false, reason: "conflict" });
    const second = await store.write(key, { n: 2 }, 1);
    assert.ok(second.ok && second.version === 2);
    // An editor still holding version 1 is told about the clash.
    assert.deepEqual(await store.write(key, { n: 3 }, 1), { ok: false, reason: "conflict" });
    const forced = await store.write(key, { n: 4 }, FORCE);
    assert.ok(forced.ok && forced.version === 3);

    const all = await store.readAll();
    assert.deepEqual(all.get(key)?.data, { n: 4 });
    assert.equal(all.get(key)?.version, 3);

    const id = `0b6f0b9e-${Date.now().toString(16).padStart(4, "0").slice(-4)}-4d6b-9f4e-3c2a1b0d9e8f`;
    await store.putImage(id, "image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const img = await store.getImage(id);
    assert.equal(img?.mime, "image/png");
    assert.equal(img?.bytes.length, 4);
    assert.equal(await store.getImage("00000000-0000-0000-0000-000000000000"), null);
  });
}

test("read-only when deployed without a database", async () => {
  delete process.env.DATABASE_URL;
  process.env.VERCEL = "1";
  try {
    const store = getStore();
    assert.equal(store.kind, "readonly");
    await assert.rejects(store.write("event", {}, 0), /Neon/);
  } finally {
    delete process.env.VERCEL;
  }
});

after(async () => {
  // Let the Postgres pool close so the test process can exit.
  const g = globalThis as unknown as { guidePool?: { end(): Promise<void> } };
  await g.guidePool?.end();
});
