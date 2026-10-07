import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePage } from "../../src/lib/markdown.ts";
import { SEED } from "../../src/lib/seed.ts";

const text = (inline: Array<{ v: string }>) => inline.map((p) => p.v).join("");

test("numbered steps become a numbered list that keeps the typed numbers", () => {
  const [card] = parsePage("## Wheel\n1. Pass\n2. Cut\n\n3. Fill\n- a bullet\n4) Find");
  assert.equal(card.kind, "card");
  if (card.kind !== "card") return;
  assert.deepEqual(
    card.blocks.map((b) => (b.kind === "ol" ? `ol@${b.start}:${b.items.map(text).join("|")}` : b.kind === "ul" ? `ul:${b.items.map(text).join("|")}` : b.kind)),
    ["ol@1:Pass|Cut", "ol@3:Fill", "ul:a bullet", "ol@4:Find"],
  );
});

test("numbers that aren't steps stay as text", () => {
  const [card] = parsePage("15–7 seconds remaining\n3 Lefties / 2 Righties\n2026. A year");
  assert.ok(card.kind === "card" && card.blocks.length === 1 && card.blocks[0].kind === "p");
});

test("the game plan reads as the coaches wrote it", () => {
  const [offence, defence] = SEED.playbook;
  const headings = (src: string) => parsePage(src).flatMap((s) => (s.kind === "card" && s.heading ? [s.heading] : []));
  assert.deepEqual(headings(offence.body).slice(0, 3), ["Less is more", "Fast break / transition", "Settled offence"]);
  assert.equal(headings(defence.body).length, 9);

  const wheel = parsePage(offence.body).find((s) => s.kind === "card" && s.heading === "Wheel motion");
  assert.ok(wheel?.kind === "card");
  const steps = wheel.blocks.find((b) => b.kind === "ol");
  assert.ok(steps?.kind === "ol" && steps.items.length === 4);
});
