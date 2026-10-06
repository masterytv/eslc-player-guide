import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { issuesOf, normalizeSection, SECTION_KEYS, sectionSchemas, slugify, type Guide } from "../../src/lib/schema.ts";
import { SECTIONS } from "../../src/lib/sections.ts";
import { SEED } from "../../src/lib/seed.ts";

test("the starting content passes validation unchanged", () => {
  for (const key of SECTION_KEYS) {
    const parsed = sectionSchemas[key].safeParse(SEED[key]);
    assert.ok(parsed.success, `${key}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues)}`);
    assert.deepEqual(parsed.data, SEED[key], `${key} changed when parsed`);
  }
});

test("every section has an editor, and every editor field exists in the schema", () => {
  assert.deepEqual([...SECTIONS.map((s) => s.key)].sort(), [...SECTION_KEYS].sort());
  for (const def of SECTIONS) {
    const schema = sectionSchemas[def.key];
    const shape = schema instanceof z.ZodArray ? (schema.element as z.ZodObject).shape : (schema as z.ZodObject).shape;
    for (const f of def.fields) assert.ok(f.key in shape, `${def.key}.${f.key} is not in the schema`);
    assert.equal(def.kind === "list", schema instanceof z.ZodArray, `${def.key} kind`);
  }
});

test("rejects links and images that aren't web links or app paths", () => {
  const links = sectionSchemas.links;
  const bad = (url: string) => !links.safeParse([{ id: "a", label: "x", url }]).success;
  assert.ok(bad("javascript:alert(1)"));
  assert.ok(bad("//evil.example"));
  assert.ok(bad("notaurl"));
  assert.ok(!bad("https://irelandlacrosse.ie"));
  assert.ok(!bad("/venue#getting"));

  const maps = sectionSchemas.maps;
  const badImg = (image: string) => !maps.safeParse([{ id: "a", title: "x", image }]).success;
  assert.ok(badImg("javascript:alert(1)"));
  assert.ok(badImg("/etc/passwd"));
  assert.ok(badImg(""));
  assert.ok(!badImg("/img/0b6f0b9e-7a1c-4d6b-9f4e-3c2a1b0d9e8f"));
  assert.ok(!badImg("/seed/field-map.jpg"));
});

test("reports problems with paths the editor can place", () => {
  const r = sectionSchemas.daily.safeParse([{ id: "d1", date: "2026-11-02", title: "ok" }, { id: "d2", date: "soon", title: "" }]);
  assert.ok(!r.success);
  const paths = issuesOf(r.error).map((i) => i.path).sort();
  assert.deepEqual(paths, ["1.date", "1.title"]);
});

test("fills in fields added after content was saved", () => {
  const r = sectionSchemas.staff.parse([{ id: "x", name: "Coach" }]);
  assert.deepEqual(r[0], { id: "x", name: "Coach", role: "", phone: "", whatsapp: true, email: "" });
  assert.deepEqual(sectionSchemas.venue.parse({ amenities: ["  Gym ", "", "Spa"] }).amenities, ["Gym", "Spa"]);
});

test("gives pages unique web addresses", () => {
  const pages = sectionSchemas.pages.parse([
    { id: "a", title: "Conduct & rules" },
    { id: "b", title: "Conduct & rules" },
    { id: "c", title: "Packing" },
    { id: "d", title: "Rules", slug: "rules" },
  ]) as Guide["pages"];
  const out = normalizeSection("pages", pages);
  assert.deepEqual(
    out.map((p) => p.slug),
    ["conduct-and-rules", "conduct-and-rules-2", "packing-page", "rules"],
  );
  assert.equal(slugify("Équipe — Barcelona trip!"), "equipe-barcelona-trip");
});

test("makes duplicate item ids unique", () => {
  const rows = sectionSchemas.links.parse([
    { id: "same", label: "a", url: "https://a.example" },
    { id: "same", label: "b", url: "https://b.example" },
  ]) as Guide["links"];
  const out = normalizeSection("links", rows);
  assert.notEqual(out[0].id, out[1].id);
});
