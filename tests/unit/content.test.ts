import assert from "node:assert/strict";
import { test } from "node:test";
import { calendar } from "../../src/lib/ics.ts";
import { parseInline, parsePage } from "../../src/lib/markdown.ts";
import { telHref, whatsappHref } from "../../src/lib/phone.ts";
import { defaultDay, entriesFor, fieldLabel, mealTimeLabel, nextGame, tripDays } from "../../src/lib/plan.ts";
import { clockRange } from "../../src/lib/time.ts";
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

test("a day's plan merges daily notes, the schedule and meals, untimed items last", () => {
  const arrival = entriesFor(SEED, "2026-10-31");
  assert.deepEqual(
    arrival.map((e) => e.title),
    ["Lunch", "Bus departs airport", "Arrive at villas, check in, get settled", "Practice", "Dinner"],
  );
  const tue = entriesFor(SEED, "2026-11-03");
  assert.deepEqual(
    tue.map((e) => e.title),
    ["Breakfast", "Lunch", "Ireland vs Italy", "Ireland vs Sweden", "Dinner", "Team meeting"],
  );
});

test("meals show on Today with their open hours and where they're served", () => {
  const sun = entriesFor(SEED, "2026-11-01").filter((e) => e.kind === "meal");
  assert.deepEqual(sun.map((e) => [e.title, e.time]), [["Breakfast", "09:00"], ["Lunch", "13:30"], ["Dinner", "20:00"]]);
  assert.equal(sun[0].meta, "Arrive 09:00 · Buffet Masia · Cambrils Park Resort");
  const [breakfast] = entriesFor(SEED, "2026-11-02").filter((e) => e.kind === "meal");
  assert.equal(breakfast.endTime, "09:30");
  assert.equal(breakfast.meta, "07:30–09:30 · Buffet Masia · Cambrils Park Resort");
  assert.equal(mealTimeLabel(SEED.meals.find((m) => m.date === "2026-11-02")!), "7:30–9:30 AM (07:30–09:30)");
  assert.equal(mealTimeLabel(SEED.meals.find((m) => m.date === "2026-10-31")!), "Arrive 1:30 PM (13:30)");
});

test("finds the next game and the day Today opens on", () => {
  assert.equal(nextGame(SEED, Date.parse("2026-11-02T10:20:00Z"))?.game.opponent, "Finland");
  // 15:00 in Spain: Finland has started, Italy is next.
  assert.equal(nextGame(SEED, Date.parse("2026-11-02T14:00:00Z"))?.game.opponent, "Italy");
  assert.equal(nextGame(SEED, Date.parse("2026-11-06T10:00:00Z")), null);
  // The same schedule in Toronto (UTC-5 by November): Finland's 14:30 start is 19:30 UTC.
  const toronto = { ...SEED, event: { ...SEED.event, timeZone: "America/Toronto" } };
  assert.equal(nextGame(toronto, Date.parse("2026-11-02T14:00:00Z"))?.at.toISOString(), "2026-11-02T19:30:00.000Z");

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
  assert.match(ics, /SUMMARY:Ireland vs Finland · Match 005/);
  assert.match(ics, /LOCATION:Field 2\\, Mediterranean Sports Hub/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  const untimed = calendar(SEED.schedule.filter((s) => s.id === "s2"), SEED);
  assert.match(untimed, /DTSTART;VALUE=DATE:20261101/);
});

test("practices away from the venue show their end time, place and directions", () => {
  const practice = SEED.schedule.find((s) => s.id === "s0")!;
  const ics = calendar([practice], SEED, new Date("2026-10-06T12:00:00Z"));
  // 17:00–18:30 in Spain (UTC+1 on 31 Oct).
  assert.match(ics, /DTSTART:20261031T160000Z\r\n/);
  assert.match(ics, /DTEND:20261031T173000Z\r\n/);
  assert.match(ics, /LOCATION:Mediterranean Sports Hub - Futbol Salou\r\n/);
  const [entry] = entriesFor(SEED, "2026-10-31").filter((e) => e.id === "s0");
  assert.equal(entry.meta, "Until 6:30 PM (18:30) · Mediterranean Sports Hub - Futbol Salou");
  assert.equal(entry.link?.label, "Directions");
  assert.equal(fieldLabel("2"), "Field 2");
  assert.equal(fieldLabel("TBD"), "Field TBD");
  assert.equal(fieldLabel("Field 1"), "Field 1");
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

test("time ranges read 1:30–3:30 PM, and AM–PM when they cross midday", () => {
  assert.deepEqual(clockRange("13:30", "15:30"), { hm: "1:30–3:30", ap: "PM", h24: "13:30–15:30" });
  assert.deepEqual(clockRange("11:30", "13:30"), { hm: "11:30–1:30", ap: "AM–PM", h24: "11:30–13:30" });
  assert.equal(clockRange("09:00", "")?.hm, "9:00");
  assert.equal(clockRange("", "10:00"), null);
});
