import assert from "node:assert/strict";
import { test } from "node:test";
import { calendar } from "../../src/lib/ics.ts";
import { parseInline, parsePage } from "../../src/lib/markdown.ts";
import { telHref, whatsappHref } from "../../src/lib/phone.ts";
import { defaultDay, entriesFor, fieldLabel, gameCountdown, highlightsFor, kitLabel, mealTimeLabel, nextGame, tripDays } from "../../src/lib/plan.ts";
import { GAME_COUNTDOWN, sectionSchemas } from "../../src/lib/schema.ts";
import { clockRange } from "../../src/lib/time.ts";
import { SEED, withSeedFields } from "../../src/lib/seed.ts";

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
    ["Bus departs airport", "Arrive at villas, check in, get settled", "Lunch", "Practice", "Dinner"],
  );
  const tue = entriesFor(SEED, "2026-11-03");
  assert.deepEqual(
    tue.map((e) => e.title),
    ["Breakfast", "Ireland vs Italy", "Boxed lunches at the field", "Ireland vs Sweden", "Dinner", "Team meeting"],
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
  const [lunch31, dinner31] = SEED.meals.filter((m) => m.date === "2026-10-31");
  assert.equal(mealTimeLabel(lunch31), "2:00–3:00 PM (14:00–15:00)");
  assert.equal(mealTimeLabel(dinner31), "Arrive 8:30 PM (20:30)");
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
  assert.match(ics, /LOCATION:Futbol Salou complex\r\n/);
  const [entry] = entriesFor(SEED, "2026-10-31").filter((e) => e.id === "s0");
  assert.equal(entry.meta, "Until 6:30 PM (18:30) · Futbol Salou complex");
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

test("each game's countdown runs from its start time", () => {
  const steps = gameCountdown(GAME_COUNTDOWN, "14:30");
  assert.deepEqual(steps[0], { time: "1:00 PM", h24: "13:00", offset: "−90 min", text: "Shuttle to the fields" });
  assert.deepEqual(steps[1], { time: "1:30 PM", h24: "13:30", offset: "−60 min", text: "Locker room opens, Ireland only. Take all items with you." });
  assert.deepEqual(steps.slice(2, 8).map((s) => s.h24), ["14:00", "14:10", "14:15", "14:23", "14:27", "14:30"]);
  assert.equal(steps[7].offset, "Start");
  assert.deepEqual(steps[8], { time: "", h24: "", offset: "+10 min after", text: "Team must leave the field" });
  assert.equal(steps.length, 9);
  // A line without a number is a reminder.
  assert.deepEqual(gameCountdown(["Bring water"], "14:30"), [{ time: "", h24: "", offset: "", text: "Bring water" }]);
  assert.deepEqual(gameCountdown(GAME_COUNTDOWN, ""), []);
});

test("an Event & alert section saved before the countdown existed, or with an older unedited one, shows the current one", () => {
  assert.deepEqual(sectionSchemas.event.parse({ team: "Ireland", alert: "" }).gameCountdown, GAME_COUNTDOWN);
  const withWhistle = [...GAME_COUNTDOWN.slice(1, 8), "Do not go on the field until the whistle blows.", GAME_COUNTDOWN[8]];
  assert.deepEqual(sectionSchemas.event.parse({ gameCountdown: withWhistle }).gameCountdown, GAME_COUNTDOWN);
  assert.deepEqual(sectionSchemas.event.parse({ gameCountdown: GAME_COUNTDOWN.slice(1) }).gameCountdown, GAME_COUNTDOWN);
  // A list staff changed is theirs.
  const edited = ["-45: Meet at the villa", ...GAME_COUNTDOWN.slice(1)];
  assert.deepEqual(sectionSchemas.event.parse({ gameCountdown: edited }).gameCountdown, edited);
});

test("games say home (white) or away (green), even on a schedule saved before the setting existed", () => {
  const sides = SEED.schedule.filter((r) => r.type === "game").map((r) => [r.opponent, kitLabel(r)]);
  assert.deepEqual(sides, [
    ["Finland", "Away · wear green"],
    ["Italy", "Home · wear white"],
    ["Sweden", "Away · wear green"],
    ["Switzerland", "Home · wear white"],
  ]);
  // A schedule staff saved in the app: no side yet, and their own ceremony time.
  const saved = sectionSchemas.schedule.parse(
    SEED.schedule.map((row) => {
      const r: Record<string, unknown> = { ...row };
      delete r.side;
      return r.id === "s2" ? { ...r, time: "16:30", notes: "Parade of Nations 16:40" } : r;
    }),
  );
  const shown = withSeedFields("schedule", saved);
  assert.equal(shown.find((r) => r.id === "s3")?.side, "away");
  assert.equal(shown.find((r) => r.id === "s5")?.side, "home");
  assert.equal(shown.find((r) => r.id === "s2")?.time, "16:30");
  assert.equal(shown.find((r) => r.id === "s2")?.notes, "Parade of Nations 16:40");
  // A side staff set themselves is kept.
  const changed = withSeedFields("schedule", saved.map((r) => (r.id === "s3" ? { ...r, side: "home" as const } : r)));
  assert.equal(changed.find((r) => r.id === "s3")?.side, "home");
});

test("spa time on 4 and 5 Nov is added, and the 2 Nov team meeting taken off, keeping staff edits", () => {
  const spa = SEED.schedule.filter((r) => r.title === "Spa time").map((r) => [r.date, r.time, r.endTime]);
  assert.deepEqual(spa, [["2026-11-04", "16:00", "17:00"], ["2026-11-05", "16:00", "17:00"]]);
  // A schedule staff saved in the app before the spa times existed, with their own ceremony time.
  const meeting = { id: "s4", date: "2026-11-02", time: "13:00", type: "meeting", title: "Team meeting", field: "Villa A64" };
  const saved = sectionSchemas.schedule.parse([
    ...SEED.schedule.filter((r) => !["s10", "s11", "s12"].includes(r.id)).map((r) => (r.id === "s2" ? { ...r, time: "16:30" } : r)),
    meeting,
  ]);
  const shown = withSeedFields("schedule", saved, "2026-10-31T10:00:00.000Z");
  assert.deepEqual(shown.filter((r) => r.title === "Spa time").map((r) => r.date), ["2026-11-04", "2026-11-05"]);
  assert.equal(shown.find((r) => r.id === "s2")?.time, "16:30");
  assert.equal(shown.find((r) => r.id === "s4"), undefined);
  assert.equal(shown.length, saved.length + 3 - 1);
  assert.equal(shown.find((r) => r.id === "s12")?.title, "Sunset swim at the beach");
  // Saved again after they were added (say, with one deleted): staff's copy wins.
  const later = withSeedFields("schedule", saved, "2026-11-02T10:00:00.000Z");
  assert.equal(later.filter((r) => r.title === "Spa time").length, 0);
  assert.ok(later.find((r) => r.id === "s4"));
  // Never added twice.
  assert.equal(withSeedFields("schedule", sectionSchemas.schedule.parse(SEED.schedule), "2026-10-31T10:00:00.000Z").length, SEED.schedule.length);
  assert.ok(entriesFor(SEED, "2026-11-04").some((e) => e.title === "Spa time" && e.meta === "Until 5:00 PM (17:00) · Spa, Cambrils Park"));
});

test("dinner on 4 Nov is the Villa Tapas Competition at 7 PM, on a meals list saved before it too", () => {
  const dinner = SEED.meals.filter((m) => m.date === "2026-11-04" && m.meal === "Dinner");
  assert.equal(dinner.length, 1);
  assert.equal(mealTimeLabel(dinner[0]), "7:00 PM (19:00)");
  assert.equal(dinner[0].place, "Villa Tapas Competition");
  const old = { id: "m14", date: "2026-11-04", meal: "Dinner", time: "19:00", endTime: "21:00", place: "Buffet Masia · Cambrils Park Resort", notes: "" };
  const saved = sectionSchemas.meals.parse([...SEED.meals.filter((m) => m.id !== "m31"), old]);
  const shown = withSeedFields("meals", saved, "2026-10-30T10:00:00.000Z");
  const wed = shown.filter((m) => m.date === "2026-11-04" && m.meal === "Dinner");
  assert.deepEqual(wed.map((m) => [m.time, m.place]), [["19:00", "Villa Tapas Competition"]]);
  assert.equal(shown.length, saved.length);
});

test("Tuesday 3 Nov: no buffet lunch, boxed lunches between the games, and a highlighted packing note", () => {
  assert.equal(SEED.meals.some((m) => m.date === "2026-11-03" && m.meal === "Lunch"), false);
  const [note] = highlightsFor(SEED, "2026-11-03");
  assert.equal(note.title, "Two games today, and rain is forecast");
  assert.match(note.details, /both uniforms.*rain gear.*undergarments, socks.*two games/);
  assert.equal(entriesFor(SEED, "2026-11-03").some((e) => e.id === "d3"), false, "kept out of the timeline");
  assert.deepEqual(highlightsFor(SEED, "2026-11-02"), []);

  // Saved in the app before these came in: each gets the change and keeps the rest.
  const lunch = { id: "m10", date: "2026-11-03", meal: "Lunch", time: "12:00", endTime: "15:00", place: "Buffet Masia · Cambrils Park Resort", notes: "" };
  const meals = withSeedFields("meals", sectionSchemas.meals.parse([...SEED.meals, lunch]), "2026-11-02T10:00:00.000Z");
  assert.equal(meals.some((m) => m.id === "m10"), false);
  const daily = withSeedFields("daily", sectionSchemas.daily.parse(SEED.daily.filter((d) => d.id !== "d3")), "2026-11-02T10:00:00.000Z");
  assert.equal(daily.find((d) => d.id === "d3")?.highlight, true);
  const schedule = withSeedFields("schedule", sectionSchemas.schedule.parse(SEED.schedule.filter((r) => r.id !== "s13")), "2026-11-02T10:00:00.000Z");
  assert.equal(schedule.filter((r) => r.id === "s13").length, 1);

  // A schedule saved after the first batch (say, with spa time deleted) only gets the new one.
  const noSpa = sectionSchemas.schedule.parse(SEED.schedule.filter((r) => !["s10", "s11", "s13"].includes(r.id)));
  const after = withSeedFields("schedule", noSpa, "2026-11-01T21:00:00.000Z");
  assert.equal(after.some((r) => r.title === "Spa time"), false);
  assert.equal(after.some((r) => r.id === "s13"), true);
});
