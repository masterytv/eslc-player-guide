import assert from "node:assert/strict";
import { test } from "node:test";
import { passcodeFingerprint, viewerMayStay } from "../../src/lib/passwords.ts";
import { ACCESS_KEY, FIRST_TOURNAMENT, SECTION_KEYS, sectionSchemas } from "../../src/lib/schema.ts";
import { SECTIONS } from "../../src/lib/sections.ts";
import { SEED } from "../../src/lib/seed.ts";
import { newTournamentSchema, startingContent, tournamentId } from "../../src/lib/tournaments.ts";

const form = {
  name: "World Sixes 2027",
  location: "Toronto, Canada",
  startDate: "2027-07-08",
  endDate: "2027-07-14",
  timeZone: "America/Toronto",
  passcode: "maple leaf",
  copyFrom: FIRST_TOURNAMENT,
  carry: SECTIONS.filter((s) => s.carryOver).map((s) => s.key),
};

test("gives tournaments short unique ids", () => {
  assert.equal(tournamentId("World Sixes 2027", []), "world-sixes-2027");
  assert.equal(tournamentId("ESLC 2026", ["eslc-2026"]), "eslc-2026-2");
  assert.equal(tournamentId("ESLC 2026", ["eslc-2026", "eslc-2026-2"]), "eslc-2026-3");
  assert.equal(tournamentId("¡¡!!", []), "tournament");
  assert.ok(tournamentId("A".repeat(200), []).length <= 40);
});

test("checks the new tournament's details", () => {
  assert.ok(newTournamentSchema.safeParse(form).success);
  const bad = newTournamentSchema.safeParse({ ...form, name: " ", endDate: "2027-07-01", timeZone: "Toronto", passcode: "abc" });
  assert.ok(!bad.success);
  const paths = bad.error.issues.map((i) => i.path.join(".")).sort();
  assert.deepEqual(paths, ["endDate", "name", "passcode", "timeZone"]);
  assert.ok(!newTournamentSchema.safeParse({ ...form, carry: ["nonsense"] }).success);
});

test("starts the next tournament with what staff carry over and the rest empty", () => {
  let n = 0;
  const input = newTournamentSchema.parse(form);
  const out = startingContent(SEED, input, () => `x${++n}`);

  for (const key of SECTION_KEYS) {
    const parsed = sectionSchemas[key].safeParse(out[key]);
    assert.ok(parsed.success, `${key} is valid`);
  }
  assert.deepEqual(out[ACCESS_KEY], { passcode: "maple leaf", version: 1 });

  const event = out.event as typeof SEED.event;
  assert.equal(event.eventName, "World Sixes 2027");
  assert.equal(event.timeZone, "America/Toronto");
  assert.equal(event.team, SEED.event.team);
  assert.equal(event.alert, "");
  assert.equal(event.scheduleUrl, "");

  // Carried over, with new item ids so calendar entries and packing ticks don't carry over too.
  const staff = out.staff as typeof SEED.staff;
  assert.deepEqual(
    staff.map((s) => s.name),
    SEED.staff.map((s) => s.name),
  );
  assert.ok(staff.every((s) => /^x\d+$/.test(s.id)));
  assert.deepEqual(out.anthem, SEED.anthem);
  // Not carried over.
  assert.deepEqual(out.schedule, []);
  assert.deepEqual(out.daily, []);
  assert.equal((out.venue as typeof SEED.venue).name, "");

  // The source is untouched.
  assert.equal(SEED.staff[0].id === staff[0].id, false);
  assert.ok(SEED.schedule.length > 0);
});

test("a player's login lasts while the live tournament's passcode is the one they used", () => {
  const live = { id: "worlds-2027", passcode: "maple leaf", version: 1 };
  const fp = passcodeFingerprint("maple leaf");
  assert.ok(fp.length > 10);
  assert.notEqual(fp, passcodeFingerprint("maple leaf 2"));

  assert.ok(viewerMayStay({ role: "viewer", fp }, live));
  // Same passcode on the next tournament: still in.
  assert.ok(viewerMayStay({ role: "viewer", fp }, { ...live, id: "eslc-2028", version: 7 }));
  // Passcode changed: signed out.
  assert.ok(!viewerMayStay({ role: "viewer", fp }, { ...live, passcode: "new one" }));
  assert.ok(!viewerMayStay({ role: "viewer", fp }, { ...live, passcode: "" }));

  // Logins from before tournaments last until the passcode changes or another tournament goes live.
  const first = { id: FIRST_TOURNAMENT, passcode: "green jersey", version: 2 };
  assert.ok(viewerMayStay({ role: "viewer", pv: 2 }, first));
  assert.ok(!viewerMayStay({ role: "viewer", pv: 1 }, first));
  assert.ok(!viewerMayStay({ role: "viewer", pv: 2 }, { ...first, id: "worlds-2027" }));
});
