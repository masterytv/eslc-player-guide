import assert from "node:assert/strict";
import { test } from "node:test";
import { calendar } from "../../src/lib/ics.ts";
import { parseInline, parsePage } from "../../src/lib/markdown.ts";
import { telHref, whatsappHref } from "../../src/lib/phone.ts";
import { defaultDay, entriesFor, nextGame, tripDays } from "../../src/lib/plan.ts";
import { SEED } from "../../src/lib/seed.ts";

test("page text splits into cards, bullets and warnings", () => {
  const conduct = SEED.pages.find((p) => p.slug === "conduct")!;
  const sections = parsePage(conduct.body);
  const cards = sections.filter((s) => s.kind === "card");
  assert.equal(cards[0].kind === "card" && cards[0].heading, "Be on time");
  assert.ok(cards.some((c) => c.kind === "card" && c.blocks.some((b) => b.kind === "ul" && b.items.length === 6)));
  assert.equal(sections[sections.length - 1].kind, "warn");
});

test("page links only allow safe destinations", () => {
  assert.deepEqual(parseInline("see [rules](https://worldlacrosse.sport) now"), [
    { t: "text", v: "see " },
    { t: "link", v: "rules", href: "https://worldlacrosse.sport" },
    { t: "text", v: " now" },
  ]);
  assert.deepEqual(parseInline("[x](javascript:alert(1))")[0].t, "text");
  assert.deepEqual(parseInline("**Bring 3 balls**"), [{ t: "bold", v: "Bring 3 balls" }]);
});

test("a day's plan merges daily notes and the schedule, untimed items last", () => {
  const arrival = entriesFor(SEED, "2026-10-31");
  assert.deepEqual(
    arrival.map((e) => e.title),
    ["Bus departs airport", "Arrive at villas, check in, get settled"],
  );
  const tue = entriesFor(SEED, "2026-11-03");
  assert.deepEqual(
    tue.map((e) => e.title),
    ["Ireland vs Italy", "Ireland vs Sweden", "Team meeting"],
  );
});

test("finds the next game and the day Today opens on", () => {
  assert.equal(nextGame(SEED, Date.parse("2026-11-02T10:20:00Z"))?.game.opponent, "Finland");
  // 15:00 in Spain: Finland has started, Italy is next.
  assert.equal(nextGame(SEED, Date.parse("2026-11-02T14:00:00Z"))?.game.opponent, "Italy");
  assert.equal(nextGame(SEED, Date.parse("2026-11-06T10:00:00Z")), null);

  const days = tripDays(SEED);
  assert.equal(days.length, 10);
  assert.equal(defaultDay(days, "2026-10-06"), "2026-10-31");
  assert.equal(defaultDay(days, "2026-11-03"), "2026-11-03");
  assert.equal(defaultDay(days, "2026-12-01"), "2026-11-09");
});

test("calendar files use UTC times and escape text", () => {
  const finland = SEED.schedule.filter((s) => s.id === "s3");
  const ics = calendar(finland, SEED, new Date("2026-10-06T12:00:00Z"));
  assert.match(ics, /DTSTART:20261102T133000Z\r\n/);
  assert.match(ics, /DTEND:20261102T143000Z\r\n/);
  assert.match(ics, /SUMMARY:Ireland vs Finland · Match 006/);
  assert.match(ics, /LOCATION:Field 2\\, Mediterranean Sports Hub/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  const untimed = calendar(SEED.schedule.filter((s) => s.id === "s1"), SEED);
  assert.match(untimed, /DTSTART;VALUE=DATE:20261101/);
});

test("phone numbers become call and WhatsApp links only when they can work abroad", () => {
  assert.equal(telHref("1 (315) 555-0123"), "tel:+13155550123");
  assert.equal(whatsappHref("1 (315) 555-0123"), "https://wa.me/13155550123");
  assert.equal(telHref("+353 87 123 4567"), "tel:+353871234567");
  assert.equal(telHref("0035387 123 4567"), "tel:+353871234567");
  assert.equal(telHref("087 123 4567"), "tel:0871234567");
  assert.equal(whatsappHref("087 123 4567"), null);
  assert.equal(telHref(""), null);
});
