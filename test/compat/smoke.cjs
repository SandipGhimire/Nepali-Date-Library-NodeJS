"use strict";

/**
 * Framework-free compatibility smoke test.
 *
 * package.json declares "engines": { "node": ">=8" }, but the vitest suite
 * itself needs a modern Node runtime and cannot run there. This script
 * instead requires the *built* dist/index.cjs bundle (produced by
 * `pnpm run build`, which targets Node 8 via esbuild + babel + terser) using
 * nothing but Node's built-in `assert` module, so it can run unmodified on
 * every Node release from 8 up to the current major.
 *
 * It intentionally mirrors the same scenarios covered in
 * test/NepaliDate.test.ts, test/DateConverter.test.ts and test/master.test.ts
 * so the compiled bundle is exercised identically to the source on modern
 * Node, including the full brute-force BS 1976-2100 round trip.
 */

const assert = require("assert");
const path = require("path");

const distPath = path.join(__dirname, "..", "..", "dist", "index.cjs");
const { NepaliDate, ADtoBS, BStoAD, NEPALI_DATE_MAP } = require(distPath);

let assertions = 0;

function check(actual, expected, message) {
  assertions += 1;
  assert.strictEqual(actual, expected, message);
}

function checkThrows(fn, message) {
  assertions += 1;
  assert.throws(fn, undefined, message);
}

function testConstruction() {
  const d = new NepaliDate(2080, 0, 15);
  check(d.getYear(), 2080, "getYear");
  check(d.getMonth(), 0, "getMonth");
  check(d.getDate(), 15, "getDate");
  check(d.format("YYYY-MM-DD"), "2080-01-15", "format YYYY-MM-DD");

  const fromAd = new NepaliDate(new Date(Date.UTC(2023, 3, 28)));
  check(fromAd.format("YYYY-MM-DD"), "2080-01-15", "construct from Date");

  const copy = new NepaliDate(d);
  check(copy.getTime(), d.getTime(), "copy constructor");

  check(new NepaliDate("2080-01-01").format("YYYY-MM-DD"), "2080-01-01", "construct from dashed string");
  check(new NepaliDate("2080/1/1").format("YYYY-MM-DD"), "2080-01-01", "construct from slashed string");
  check(new NepaliDate("2080").format("YYYY-MM-DD"), "2080-01-01", "construct from year-only string");

  check(new NepaliDate().isValid(), true, "no-arg constructor gives a valid current date");

  checkThrows(() => new NepaliDate("not-a-date"), "invalid date string throws");
  checkThrows(() => new NepaliDate("1975-01-01"), "year out of range throws");
  checkThrows(() => new NepaliDate("2080-13-01"), "invalid month throws");
  checkThrows(() => new NepaliDate("2080-01-32"), "invalid day throws");
}

function testFormatting() {
  const d = new NepaliDate(2080, 0, 15);

  check(d.format("YYYY"), "2080", "YYYY");
  check(d.format("MMM"), "Bai", "MMM");
  check(d.format("MMMM"), "Baisakh", "MMMM");
  check(d.format("DDD"), "Fri", "DDD");
  check(d.format("DDDD"), "Friday", "DDDD");

  check(d.format("yyyy"), "२०८०", "yyyy (Nepali digits)");
  check(d.format("dddd"), "शुक्रबार", "dddd (Nepali weekday)");

  check(d.format('"M"MM'), "M01", "quoted literal");
  check(d.toString(), "2080/1/15", "toString");
}

function testArithmetic() {
  const d = new NepaliDate(2080, 0, 31);
  check(d.addDays(1).format("YYYY-MM-DD"), "2080-02-01", "addDays rollover");

  const start = new NepaliDate(2080, 0, 15);
  const back1 = start.addMonths(-1);
  check(back1.getYear(), 2079, "addMonths(-1) year");
  check(back1.getMonth(), 11, "addMonths(-1) month");

  const capped = new NepaliDate(2084, 10, 30).addYears(1);
  check(capped.format("YYYY-MM-DD"), "2085-11-29", "addYears caps day length");
}

function testCalendarMetadata() {
  const d = new NepaliDate(2080, 0, 15);
  check(d.daysInMonth(), 31, "daysInMonth");
  check(d.isLeapYear(), false, "isLeapYear");
  check(d.getWeeksInMonth(), 6, "getWeeksInMonth");

  check(NepaliDate.minimum().toISOString().slice(0, 10), "1919-04-13", "minimum()");

  const max = new NepaliDate(NepaliDate.maximum());
  const last = NEPALI_DATE_MAP[NEPALI_DATE_MAP.length - 1];
  check(max.getYear(), last.year, "maximum() round-trips year");
  check(max.getDate(), last.days[11], "maximum() round-trips day");
}

function testStartEndHelpers() {
  const d = new NepaliDate(2080, 0, 15);
  check(d.startOfWeek().format("YYYY-MM-DD"), "2080-01-10", "startOfWeek");
  check(d.endOfWeek().format("YYYY-MM-DD"), "2080-01-16", "endOfWeek");
  check(d.startOfMonth().format("YYYY-MM-DD"), "2080-01-01", "startOfMonth");
  check(d.endOfMonth().format("YYYY-MM-DD"), "2080-01-31", "endOfMonth");
  check(d.startOfYear().format("YYYY-MM-DD"), "2080-01-01", "startOfYear");
  check(d.endOfYear().format("YYYY-MM-DD"), "2080-12-30", "endOfYear");
}

function testComparisonsAndQuarters() {
  const a = new NepaliDate(2080, 0, 1);
  const b = new NepaliDate(2080, 0, 15);
  check(b.isAfter(a), true, "isAfter");
  check(a.isBefore(b), true, "isBefore");
  check(a.diff(b, "day") < 0, true, "diff day");

  const q1 = NepaliDate.getQuarter(1, 2080);
  check(q1.start.format("YYYY-MM-DD"), "2080-01-01", "getQuarter start");
  check(q1.end.format("YYYY-MM-DD"), "2080-03-31", "getQuarter end");

  check(NepaliDate.getMonthName(0), "Baisakh", "getMonthName");
  check(NepaliDate.getDayName(0), "Sunday", "getDayName");
  check(NepaliDate.isValid(2080, 0, 32), false, "isValid rejects invalid day");
}

function testDateConverter() {
  check(ADtoBS("2023-04-14"), "2080-01-01", "ADtoBS known date");
  check(BStoAD("2080-01-01"), "2023-04-14", "BStoAD known date");

  const ad = "2023-04-28";
  check(BStoAD(ADtoBS(ad)), ad, "AD -> BS -> AD round trip");

  checkThrows(() => ADtoBS("2023/04/14"), "ADtoBS rejects malformed input");
  checkThrows(() => BStoAD("2080/01/01"), "BStoAD rejects malformed input");
  checkThrows(() => ADtoBS("1800-01-01"), "ADtoBS rejects out-of-range date");
}

/**
 * Full brute-force round trip across every supported day (BS 1976-2100),
 * mirroring test/master.test.ts, but run against the compiled dist bundle
 * on this exact Node version.
 */
function testFullRange() {
  for (const yearData of NEPALI_DATE_MAP) {
    for (const [monthIndex, daysInMonth] of yearData.days.entries()) {
      for (let day = 1; day <= daysInMonth; day++) {
        const nd = new NepaliDate(yearData.year, monthIndex, day);
        const expected = nd.format("YYYY-MM-DD");

        const bsToAd = BStoAD(expected);
        const nd2 = new NepaliDate(new Date(bsToAd));
        const adToBs = ADtoBS(bsToAd);

        check(nd2.format("YYYY-MM-DD"), expected, `round-trip mismatch for ${expected}`);
        check(adToBs, expected, `ADtoBS mismatch for ${expected}`);
      }
    }
  }
}

testConstruction();
testFormatting();
testArithmetic();
testCalendarMetadata();
testStartEndHelpers();
testComparisonsAndQuarters();
testDateConverter();
testFullRange();

console.log(`OK: ${assertions} compatibility assertions passed on Node ${process.version}`);
