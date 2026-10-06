import assert from "node:assert/strict";
import { test } from "node:test";
import { ago, clockLabel, countdown, dateRange, dayLabel, isDate, rangeLabel, toMinutes, zonedNow, zonedToUtc } from "../../src/lib/time.ts";

test("converts Spain wall-clock time to UTC across the October clock change", () => {
  // Spain is UTC+1 in November (after 25 Oct 2026) and UTC+2 before it.
  assert.equal(zonedToUtc("2026-11-02", "14:30").toISOString(), "2026-11-02T13:30:00.000Z");
  assert.equal(zonedToUtc("2026-10-24", "14:30").toISOString(), "2026-10-24T12:30:00.000Z");
  assert.equal(zonedToUtc("2026-10-31", "").toISOString(), "2026-10-30T23:00:00.000Z");
});

test("reads the current date and minute in Spain", () => {
  assert.deepEqual(zonedNow(new Date("2026-11-02T10:20:00Z")), { date: "2026-11-02", minutes: 11 * 60 + 20 });
  // Just after midnight UTC is already the next day in Spain.
  assert.deepEqual(zonedNow(new Date("2026-11-02T23:30:00Z")), { date: "2026-11-03", minutes: 30 });
});

test("formats clock times and days the way the guide shows them", () => {
  assert.equal(clockLabel("14:30"), "2:30 PM");
  assert.equal(clockLabel("00:05"), "12:05 AM");
  assert.equal(clockLabel("12:00"), "12:00 PM");
  assert.equal(clockLabel(""), "TBC");
  assert.equal(clockLabel("", "TBD"), "TBD");
  assert.equal(dayLabel("2026-11-02"), "Mon 2 Nov");
  assert.equal(rangeLabel("2026-10-31", "2026-11-09"), "31 Oct – 9 Nov");
  assert.equal(rangeLabel("2026-11-01", "2026-11-09"), "1–9 Nov");
});

test("validates dates and times", () => {
  assert.equal(isDate("2026-11-02"), true);
  assert.equal(isDate("2026-02-30"), false);
  assert.equal(isDate("02/11/2026"), false);
  assert.equal(toMinutes("17:00"), 1020);
  assert.equal(toMinutes("24:00"), null);
  assert.equal(toMinutes(""), null);
});

test("lists every trip day and caps runaway ranges", () => {
  const days = dateRange("2026-10-31", "2026-11-09");
  assert.equal(days.length, 10);
  assert.equal(days[0], "2026-10-31");
  assert.equal(days[9], "2026-11-09");
  assert.equal(dateRange("2026-01-01", "2030-01-01").length, 60);
  assert.deepEqual(dateRange("2026-11-09", "2026-10-31"), ["2026-11-09"]);
});

test("describes durations in plain words", () => {
  const t0 = Date.parse("2026-11-02T10:20:00Z");
  assert.equal(countdown(t0, t0 + 190 * 60_000), "3 h 10 min");
  assert.equal(countdown(t0, t0 + 25 * 60_000), "25 min");
  assert.equal(countdown(t0, t0 + 27 * 24 * 3600_000), "27 days");
  assert.equal(ago(new Date(t0 - 4 * 60_000).toISOString(), t0), "4 min ago");
  assert.equal(ago(new Date(t0).toISOString(), t0), "just now");
  assert.equal(ago(null, t0), "");
});
