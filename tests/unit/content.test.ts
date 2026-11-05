import assert from "node:assert/strict";
import { test } from "node:test";
import { calendar } from "../../src/lib/ics.ts";
import { parseInline, parsePage } from "../../src/lib/markdown.ts";
import { telHref, whatsappHref } from "../../src/lib/phone.ts";
import { defaultDay, entriesFor, fieldLabel, gameCountdown, gameLabel, highlightsFor, kitLabel, mealTimeLabel, nextGame, tripDays } from "../../src/lib/plan.ts";
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
    [
      "Breakfast",
      "Breakfast pick-up loops",
      "Walkthrough",
      "Meet at A64",
      "Pick-up for the field",
      "Arrive at the field",
      "Start stretching and moving",
      "Warm-up",
      "Take the field",
      "Ireland vs Italy",
      "Game and singing done",
      "Start moving and stretching",
      "Take the field",
      "Ireland vs Sweden",
      "Done, head home",
      "Dinner on your own",
    ],
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
  assert.equal(nextGame(SEED, Date.parse("2026-11-06T10:00:00Z"))?.game.opponent, "Czechia");
  assert.equal(nextGame(SEED, Date.parse("2026-11-06T16:00:00Z")), null);
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
    ["Czechia", "Away · wear green"],
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

test("Tuesday 3 Nov: the coaches' plan, no countdowns, no buffet lunch or dinner, and the packing note", () => {
  assert.deepEqual(SEED.meals.filter((m) => m.date === "2026-11-03").map((m) => m.meal), ["Breakfast"]);
  assert.equal(SEED.schedule.some((r) => r.id === "s13"), false);
  assert.deepEqual(SEED.schedule.filter((r) => r.date === "2026-11-03" && r.hideCountdown).map((r) => r.opponent), ["Italy", "Sweden"]);
  const [note] = highlightsFor(SEED, "2026-11-03");
  assert.equal(note.title, "Two games today, and rain is forecast");
  const lunch = SEED.daily.find((d) => d.id === "d12");
  assert.equal(lunch?.details, "Change, regroup and eat lunch (boxed lunches at the field)");

  // A schedule, meals and daily notes saved in the app before this: each gets the change and keeps the rest.
  const before = "2026-11-03T10:00:00.000Z";
  const boxed = { id: "s13", date: "2026-11-03", time: "13:30", type: "other", title: "Boxed lunches at the field" };
  const schedule = withSeedFields(
    "schedule",
    sectionSchemas.schedule.parse([
      ...SEED.schedule.map((r) => ({ ...r, hideCountdown: false })),
      boxed,
      { id: "s6", date: "2026-11-03", time: "", type: "meeting", title: "Team meeting" },
    ]),
    before,
  );
  assert.equal(schedule.some((r) => r.id === "s13"), false);
  assert.equal(schedule.some((r) => r.date === "2026-11-03" && r.title === "Team meeting"), false);
  assert.equal(schedule.find((r) => r.id === "s5")?.hideCountdown, true);
  const dinner = { id: "m11", date: "2026-11-03", meal: "Dinner", time: "19:00", endTime: "21:00", place: "Buffet Masia · Cambrils Park Resort", notes: "" };
  const meals = withSeedFields("meals", sectionSchemas.meals.parse([...SEED.meals, dinner]), before);
  assert.equal(meals.some((m) => m.id === "m11"), false);
  const daily = withSeedFields("daily", sectionSchemas.daily.parse(SEED.daily.filter((d) => !/^d(4|5|6|7|8|9|1\d)$/.test(d.id))), before);
  assert.equal(daily.filter((d) => d.date === "2026-11-03").length, 14);
});

test("Wednesday 4 Nov: practice 9:30–11:00 with its own timeline, replacing the TBC practice", () => {
  const wed = SEED.schedule.filter((r) => r.date === "2026-11-04" && r.type === "practice");
  assert.equal(wed.length, 1);
  assert.deepEqual([wed[0].time, wed[0].endTime], ["09:20", "11:00"]);
  assert.deepEqual(wed[0].steps, [
    "9:20 AM | Meet at the front desk entrance (where we arrived on the bus the first day)",
    "9:20–9:30 AM | Shuttle to practice: Conway's van",
    "9:30–11:00 AM | Practice",
  ]);
  // A schedule saved in the app with the old TBC practice: it's swapped, everything else stays.
  const old = { id: "s8", date: "2026-11-04", time: "", type: "practice", title: "Practice", notes: "No game today." };
  const saved = sectionSchemas.schedule.parse([...SEED.schedule.filter((r) => r.id !== "s14"), old]);
  const shown = withSeedFields("schedule", saved, "2026-11-03T20:00:00.000Z");
  assert.equal(shown.some((r) => r.id === "s8"), false);
  assert.equal(shown.find((r) => r.id === "s14")?.steps.length, 3);
  assert.equal(shown.length, saved.length);
  assert.deepEqual(entriesFor(SEED, "2026-11-04").find((e) => e.id === "s14")?.steps, wed[0].steps);
});

test("Wednesday 4 Nov: a red note at the top to send tapas ingredients to Liz by practice", () => {
  const [note] = highlightsFor(SEED, "2026-11-04");
  assert.equal(note.title, "Submit ingredients for tapas to Liz by practice.");
  assert.equal(note.red, true);
  assert.equal(highlightsFor(SEED, "2026-11-03")[0].red, false);
  const saved = sectionSchemas.daily.parse(SEED.daily.filter((d) => d.id !== "d17"));
  assert.equal(withSeedFields("daily", saved, "2026-11-04T05:00:00.000Z").find((d) => d.id === "d17")?.red, true);
});

test("Wednesday 4 Nov: breakfast and lunch are marked optional, on a saved meals list too", () => {
  const wed = SEED.meals.filter((m) => m.date === "2026-11-04");
  assert.deepEqual(wed.map((m) => [m.meal, m.notes]), [["Breakfast", "Optional"], ["Lunch", "Optional"], ["Dinner", ""]]);
  const saved = sectionSchemas.meals.parse(SEED.meals.map((m) => ({ ...m, notes: "" })));
  const shown = withSeedFields("meals", saved, "2026-11-04T06:00:00.000Z");
  assert.deepEqual(shown.filter((m) => m.date === "2026-11-04").map((m) => m.notes), ["Optional", "Optional", ""]);
  assert.equal(entriesFor(SEED, "2026-11-04").find((e) => e.title === "Breakfast")?.details, "Optional");
});

test("the photography link is featured under Useful information, on a saved links list too", () => {
  const photo = SEED.links.find((l) => l.label === "Photography");
  assert.equal(photo?.url, "https://worldlacrosse.photoshelter.com/galleries/C0000cALTCfJccDw/2026-European-Sixes-Championships-Salou-Spain");
  assert.equal(photo?.featured, true);
  assert.deepEqual(SEED.links.filter((l) => l.featured).map((l) => l.label), ["Photography", "Point Bench Stats"]);
  assert.equal(SEED.links.find((l) => l.label === "Point Bench Stats")?.url, "https://worldlacrosse.sport/eslc26-women/");
  const saved = sectionSchemas.links.parse(SEED.links.filter((l) => !["l5", "l6"].includes(l.id)));
  assert.equal(withSeedFields("links", saved, "2026-11-04T05:00:00.000Z").find((l) => l.id === "l5")?.featured, true);
  assert.deepEqual(
    withSeedFields("links", saved, "2026-11-04T05:00:00.000Z").filter((l) => l.featured).map((l) => l.id),
    ["l5", "l6"],
  );
});

test("a Laundry page under Team: front desk, €11 for half a large bag, €22 for a full one", () => {
  const page = SEED.pages.find((p) => p.slug === "laundry");
  assert.equal(page?.group, "team");
  assert.match(page?.body ?? "", /front desk/);
  assert.match(page?.body ?? "", /€11\*\*: half a large garbage bag/);
  assert.match(page?.body ?? "", /€22\*\*: a full large garbage bag/);
  const saved = sectionSchemas.pages.parse(SEED.pages.filter((p) => p.id !== "pg6"));
  assert.ok(withSeedFields("pages", saved, "2026-11-04T05:00:00.000Z").some((p) => p.slug === "laundry"));
});

test("Thursday 5 Nov: the Switzerland game has its own timeline in place of the countdown", () => {
  const game = SEED.schedule.find((r) => r.id === "s9")!;
  assert.equal(game.opponent, "Switzerland");
  assert.equal(game.steps[0], "11:00 AM | Shuttle to the field · Meet at reception");
  assert.equal(game.steps[1], "11:15 AM | Dynamic stretching on the side field");
  assert.equal(game.steps.at(-1), "2:30 PM | Locker room and ice baths");
  assert.equal(game.steps.length, 12);
  // A schedule saved in the app before the timeline existed gets it for that game; other games keep the countdown.
  const saved = sectionSchemas.schedule.parse(SEED.schedule.map((r) => ({ ...r, steps: [] })));
  const shown = withSeedFields("schedule", saved, "2026-11-04T06:00:00.000Z");
  assert.deepEqual(shown.find((r) => r.id === "s9")?.steps, game.steps);
  assert.deepEqual(shown.find((r) => r.id === "s3")?.steps, []);
});

test("Friday 6 Nov: the 4 PM quarterfinal, lunch at noon, and the plan around it", () => {
  const qf = SEED.schedule.find((r) => r.date === "2026-11-06" && r.type === "game")!;
  assert.deepEqual([qf.time, qf.field, qf.warmup, qf.side, qf.hideCountdown], ["16:00", "Field 1", "15:30", "away", false]);
  assert.deepEqual(
    gameCountdown(SEED.event.gameCountdown, qf.time).map((s) => s.time || s.offset),
    ["2:30 PM", "3:00 PM", "3:30 PM", "3:40 PM", "3:45 PM", "3:53 PM", "3:57 PM", "4:00 PM", "+10 min after"],
  );
  assert.equal(gameLabel(qf), "Playoff");
  assert.equal(gameLabel(SEED.schedule.find((r) => r.id === "s3")!), "Pool play");
  assert.deepEqual(
    SEED.meals.filter((m) => m.date === "2026-11-06").map((m) => [m.meal, mealTimeLabel(m)]),
    [["Lunch", "12:00 PM (12:00)"]],
  );
  const day = entriesFor(SEED, "2026-11-06");
  assert.deepEqual(day.map((e) => e.title), [
    "Breakfast on your own",
    "Lunch",
    "Walkthrough",
    "Leave for the fields",
    "Start warm-up",
    "Take the field",
    "Ireland vs Czechia",
    "After the game",
    "Team meeting & film",
  ]);
  assert.equal(day.find((e) => e.title === "Lunch")?.meta, "12:00");
  assert.deepEqual(day.filter((e) => e.when).map((e) => e.when), ["Morning", "After"]);
  // Saved in the app before this: each gets Friday's changes and keeps the rest.
  const before = "2026-11-05T12:00:00.000Z";
  const meals = withSeedFields(
    "meals",
    sectionSchemas.meals.parse([
      ...SEED.meals.filter((m) => m.id !== "m32"),
      { id: "m18", date: "2026-11-06", meal: "Breakfast", time: "07:30", endTime: "09:30" },
      { id: "m19", date: "2026-11-06", meal: "Lunch", time: "12:00", endTime: "15:00" },
      { id: "m20", date: "2026-11-06", meal: "Dinner", time: "19:00", endTime: "21:00" },
    ]),
    before,
  );
  assert.deepEqual(meals.filter((m) => m.date === "2026-11-06").map((m) => m.id), ["m32"]);
  const schedule = withSeedFields("schedule", sectionSchemas.schedule.parse(SEED.schedule.filter((r) => r.id !== "s15")), before);
  assert.equal(schedule.filter((r) => r.id === "s15").length, 1);
});

test("Friday's notes reach daily notes saved in the app on Thursday evening, without doubling up", () => {
  const thursdayMeeting = { id: "x1", date: "2026-11-05", time: "20:30", title: "Team meeting & film" };
  const savedWithout = sectionSchemas.daily.parse([...SEED.daily.filter((d) => d.date !== "2026-11-06"), thursdayMeeting]);
  const shown = withSeedFields("daily", savedWithout, "2026-11-05T17:30:00.000Z");
  assert.deepEqual(
    shown.filter((d) => d.date === "2026-11-06").map((d) => [d.time, d.title]).find(([t]) => t === "20:00"),
    ["20:00", "Team meeting & film"],
  );
  assert.ok(shown.some((d) => d.id === "x1"));
  const savedWith = sectionSchemas.daily.parse([...SEED.daily, thursdayMeeting]);
  assert.equal(withSeedFields("daily", savedWith, "2026-11-05T17:30:00.000Z").length, savedWith.length);
});
