import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePage } from "../../src/lib/markdown.ts";
import { olderThanSeed, SEED } from "../../src/lib/seed.ts";

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

test("labelled boxes hold the lines under them, and a card can end on a bottom line", () => {
  const [card, note] = parsePage(
    "## Clock\n**Know the clock.**\n\n### Window\n\n**15–7 seconds.** Shoot.\n1. one\n\nAfter the box\n### Next\nText\n>> Make the defence work\n> a note",
  );
  assert.ok(card.kind === "card");
  assert.deepEqual(
    card.blocks.map((b) => (b.kind === "point" ? `point:${b.label}[${b.blocks.map((x) => x.kind).join(",")}]` : `${b.kind}:${"inline" in b ? text(b.inline) : ""}`)),
    ["key:Know the clock.", "point:Window[p,ol]", "p:After the box", "point:Next[p]", "banner:Make the defence work"],
  );
  assert.equal(note.kind, "note");
  // Bold inside a sentence is just bold.
  const [plain] = parsePage("Make **this** happen");
  assert.ok(plain.kind === "card" && plain.blocks[0].kind === "p");
});

test("the game plan reads as the coaches wrote it", () => {
  const [offence, defence] = SEED.playbook;
  const cards = (src: string) => parsePage(src).filter((s) => s.kind === "card");
  const headings = (src: string) => cards(src).map((s) => (s.kind === "card" ? s.heading : null));
  assert.deepEqual(headings(offence.body).slice(0, 3), ["Offensive philosophy — less is more", "Fast break / transition", "Settled offence & spacing"]);
  assert.equal(headings(offence.body).length, 10);
  assert.equal(headings(defence.body).length, 9);
  // Every slide but the last ends on its bottom line.
  for (const src of [offence.body, defence.body]) {
    const ends = cards(src).map((c) => (c.kind === "card" ? c.blocks.at(-1)?.kind : null));
    assert.deepEqual(ends.slice(0, -1).filter((k) => k !== "banner"), []);
  }

  const wheel = cards(offence.body).find((s) => s.kind === "card" && s.heading === "Wheel motion");
  assert.ok(wheel?.kind === "card");
  const steps = wheel.blocks.find((b) => b.kind === "ol");
  assert.ok(steps?.kind === "ol" && steps.items.length === 4);
});

test("a game plan saved before the coaches' new one gives way to it", () => {
  assert.equal(olderThanSeed("playbook", "2026-10-06T09:00:00.000Z"), true);
  assert.equal(olderThanSeed("playbook", "2026-10-20T09:00:00.000Z"), false);
  assert.equal(olderThanSeed("schedule", "2026-10-06T09:00:00.000Z"), false);
});
