import { describe, it, expect } from "vitest";
import { NepaliDate, NEPALI_DATE_MAP } from "../src/index";

describe("NepaliDate", () => {
  // -------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------
  describe("construction", () => {
    it("constructs with year, month, day", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.getYear()).toBe(2080);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(15);
      expect(d.format("YYYY-MM-DD")).toBe("2080-01-15");
    });

    it("constructs from a Date object", () => {
      const ad = new Date(Date.UTC(2023, 3, 28));
      const d = new NepaliDate(ad);
      expect(d.format("YYYY-MM-DD")).toBe("2080-01-15");
    });

    it("constructs from another NepaliDate, copying its state", () => {
      const original = new NepaliDate(2080, 5, 10);
      const copy = new NepaliDate(original);

      expect(copy.getYear()).toBe(original.getYear());
      expect(copy.getMonth()).toBe(original.getMonth());
      expect(copy.getDate()).toBe(original.getDate());
      expect(copy.getTime()).toBe(original.getTime());
    });

    it.each([
      ["dashes", "2080-01-01"],
      ["slashes", "2080/1/1"],
      ["dots", "2080.1.1"],
      ["year only defaults month/day to 1", "2080"],
    ])("constructs from string (%s)", (_label, input) => {
      const d = new NepaliDate(input);
      expect(d.format("YYYY-MM-DD")).toBe("2080-01-01");
    });

    it("constructs from an epoch millisecond timestamp", () => {
      const d = new NepaliDate(Date.UTC(1919, 3, 13));
      expect(d.format("YYYY-MM-DD")).toBe("1976-01-01");
    });

    it("constructs a valid current date with no arguments", () => {
      const d = new NepaliDate();
      expect(d.isValid()).toBe(true);
    });

    it("throws on an invalid argument type", () => {
      expect(() => new NepaliDate(true as unknown as number)).toThrow("Invalid argument syntax");
    });

    it("throws on an invalid date string", () => {
      expect(() => new NepaliDate("not-a-date")).toThrow();
    });

    it("throws on year out of range", () => {
      expect(() => new NepaliDate("1975-01-01")).toThrow("Nepal year out of range");
    });

    it("throws on invalid month", () => {
      expect(() => new NepaliDate("2080-13-01")).toThrow("Invalid nepali month must be between 1 - 12");
    });

    it("throws on invalid day", () => {
      expect(() => new NepaliDate("2080-01-32")).toThrow();
    });

    it("set() throws with an exclamation-marked message on year out of range", () => {
      const d = new NepaliDate(2080, 0, 1);
      expect(() => {
        d.set(1800, 0, 1);
      }).toThrow("Nepal year out of range!");
    });
  });

  // -------------------------------------------------------------------
  // Formatting
  // -------------------------------------------------------------------
  describe("formatting", () => {
    it("formats English tokens", () => {
      const d = new NepaliDate(2080, 0, 15);

      expect(d.format("YYYY")).toBe("2080");
      expect(d.format("YYY")).toBe("080");
      expect(d.format("YY")).toBe("80");

      expect(d.format("M")).toBe("1");
      expect(d.format("MM")).toBe("01");
      expect(d.format("MMM")).toBe("Bai");
      expect(d.format("MMMM")).toBe("Baisakh");

      expect(d.format("D")).toBe("15");
      expect(d.format("DD")).toBe("15");
      expect(d.format("DDD")).toBe("Fri");
      expect(d.format("DDDD")).toBe("Friday");
    });

    it("formats Nepali tokens", () => {
      const d = new NepaliDate(2080, 0, 15);

      expect(d.format("yyyy")).toBe("२०८०");
      expect(d.format("m")).toBe("१");
      expect(d.format("mm")).toBe("०१");
      expect(d.format("mmm")).toBe("बै");
      expect(d.format("mmmm")).toBe("बैशाख");
      expect(d.format("dd")).toBe("१५");
      expect(d.format("ddd")).toBe("शुक्र");
      expect(d.format("dddd")).toBe("शुक्रबार");
    });

    it("formats with quoted literals", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.format('"M"MM')).toBe("M01");
    });

    it("toString matches format of Y/M/D", () => {
      const d = new NepaliDate(2080, 0, 5);
      expect(d.toString()).toBe("2080/1/5");
      expect(`${d}`).toBe("2080/1/5");
    });
  });

  // -------------------------------------------------------------------
  // Arithmetic
  // -------------------------------------------------------------------
  describe("arithmetic", () => {
    it("addDays rolls into the next month", () => {
      const d = new NepaliDate(2080, 0, 31); // Baisakh 2080 has 31 days
      expect(d.addDays(1).format("YYYY-MM-DD")).toBe("2080-02-01");
    });

    it("addMonths within the same year", () => {
      const d = new NepaliDate(2080, 0, 15);
      const next = d.addMonths(1);
      expect(next.getYear()).toBe(2080);
      expect(next.getMonth()).toBe(1);
    });

    /**
     * Regression test: addMonths() used to double-decrement the year when
     * crossing a year boundary going backwards (e.g. -1 month from Baisakh
     * landed a full year too early).
     */
    it("addMonths does not double-count the year on negative rollover", () => {
      const start = new NepaliDate(2080, 0, 15);

      const back1 = start.addMonths(-1);
      expect(back1.getYear()).toBe(2079);
      expect(back1.getMonth()).toBe(11);

      const back13 = start.addMonths(-13);
      expect(back13.getYear()).toBe(2078);
      expect(back13.getMonth()).toBe(11);

      const back12 = start.addMonths(-12);
      expect(back12.getYear()).toBe(2079);
      expect(back12.getMonth()).toBe(0);
    });

    it("addYears caps the day to the target month length", () => {
      const d = new NepaliDate(2084, 10, 30); // Falgun 30, 2084
      const next = d.addYears(1);
      expect(next.format("YYYY-MM-DD")).toBe("2085-11-29"); // 2085's Falgun only has 29 days
    });

    it("setYear/setMonth/setDate mutate the instance", () => {
      const d = new NepaliDate(2080, 0, 15);

      d.setYear(2081);
      expect(d.getYear()).toBe(2081);

      d.setMonth(5);
      expect(d.getMonth()).toBe(5);

      d.setDate(20);
      expect(d.getDate()).toBe(20);
    });
  });

  // -------------------------------------------------------------------
  // Calendar metadata
  // -------------------------------------------------------------------
  describe("calendar metadata", () => {
    it("daysInMonth and isLeapYear", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.daysInMonth()).toBe(31);
      expect(d.isLeapYear()).toBe(false);
    });

    it("getWeeksInMonth", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.getWeeksInMonth()).toBe(6);
    });

    it("minimum and maximum", () => {
      expect(NepaliDate.minimum().toISOString().slice(0, 10)).toBe("1919-04-13");

      const last = NEPALI_DATE_MAP[NEPALI_DATE_MAP.length - 1];
      const expectedMaxAd = new NepaliDate(last.year, 11, last.days[11]).getEnglishDate().toISOString().slice(0, 10);
      expect(NepaliDate.maximum().toISOString().slice(0, 10)).toBe(expectedMaxAd);
    });

    /**
     * Regression test: maximum() used to return a date one day past the
     * actual last supported day (daysTillNow is a 1-indexed count), which
     * meant round-tripping it back into a NepaliDate would throw.
     */
    it("maximum round-trips back into a valid NepaliDate", () => {
      const max = new NepaliDate(NepaliDate.maximum());
      const last = NEPALI_DATE_MAP[NEPALI_DATE_MAP.length - 1];

      expect(max.getYear()).toBe(last.year);
      expect(max.getMonth()).toBe(11);
      expect(max.getDate()).toBe(last.days[11]);
      expect(max.isValid()).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // Getters for the underlying instant
  // -------------------------------------------------------------------
  describe("time getters", () => {
    it("returns hours, minutes, seconds, milliseconds and epoch time", () => {
      const ad = new Date(Date.UTC(2023, 3, 28, 13, 45, 30, 250));
      const d = new NepaliDate(ad);

      expect(d.getHours()).toBe(13);
      expect(d.getMinutes()).toBe(45);
      expect(d.getSeconds()).toBe(30);
      expect(d.getMilliseconds()).toBe(250);
      expect(d.getTime()).toBe(ad.getTime());
    });
  });

  // -------------------------------------------------------------------
  // Start/end of day/week/month/year
  // -------------------------------------------------------------------
  describe("start/end helpers", () => {
    it("startOfDay and endOfDay", () => {
      const d = new NepaliDate(2080, 0, 15);

      expect(d.startOfDay().getEnglishDate().toISOString()).toBe("2023-04-28T00:00:00.000Z");
      expect(d.endOfDay().getEnglishDate().toISOString()).toBe("2023-04-28T23:59:59.999Z");
      expect(d.endOfDay().getMilliseconds()).toBe(999);
    });

    it("startOfWeek and endOfWeek", () => {
      const d = new NepaliDate(2080, 0, 15); // Friday

      expect(d.startOfWeek().format("YYYY-MM-DD")).toBe("2080-01-10");
      expect(d.startOfWeek().getDay()).toBe(0);
      expect(d.endOfWeek().format("YYYY-MM-DD")).toBe("2080-01-16");
    });

    it("startOfWeek rejects an out-of-range argument", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(() => d.startOfWeek(7)).toThrow("startOfWeek must be an integer between 0 and 6");
    });

    it("startOfMonth and endOfMonth", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.startOfMonth().format("YYYY-MM-DD")).toBe("2080-01-01");
      expect(d.endOfMonth().format("YYYY-MM-DD")).toBe("2080-01-31");
    });

    it("startOfYear and endOfYear", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.startOfYear().format("YYYY-MM-DD")).toBe("2080-01-01");
      expect(d.endOfYear().format("YYYY-MM-DD")).toBe("2080-12-30");
    });
  });

  // -------------------------------------------------------------------
  // Comparisons and diff
  // -------------------------------------------------------------------
  describe("comparisons and diff", () => {
    it("isAfter/isBefore/isEqual", () => {
      const a = new NepaliDate(2080, 0, 1);
      const b = new NepaliDate(2080, 0, 15);
      const c = new NepaliDate(2080, 0, 1);

      expect(b.isAfter(a)).toBe(true);
      expect(a.isBefore(b)).toBe(true);
      expect(a.isEqual(c)).toBe(true);
      expect(a.isEqual(b)).toBe(false);
    });

    it("isSame for year/month/day units", () => {
      const a = new NepaliDate(2080, 5, 10);
      const b = new NepaliDate(2080, 5, 20);
      const c = new NepaliDate(2081, 5, 10);

      expect(a.isSame(b, "year")).toBe(true);
      expect(a.isSame(b, "month")).toBe(true);
      expect(a.isSame(b, "day")).toBe(false);
      expect(a.isSame(c, "year")).toBe(false);
    });

    it("diff for day/month/year units", () => {
      const a = new NepaliDate(2080, 5, 10);
      const b = new NepaliDate(2080, 0, 10);

      expect(a.diff(b, "month")).toBe(5);
      expect(a.diff(b, "year")).toBe(0);
      expect(a.diff(b, "day")).toBeGreaterThan(0);
    });

    it("diff throws on an invalid unit", () => {
      const a = new NepaliDate(2080, 5, 10);
      const b = new NepaliDate(2080, 0, 10);

      expect(() => a.diff(b, "week" as "day")).toThrow("Invalid unit for diff calculation");
    });
  });

  // -------------------------------------------------------------------
  // Quarters and fiscal years
  // -------------------------------------------------------------------
  describe("quarters and fiscal years", () => {
    it("getQuarter", () => {
      const q1 = NepaliDate.getQuarter(1, 2080);
      expect(q1.start.format("YYYY-MM-DD")).toBe("2080-01-01");
      expect(q1.end.format("YYYY-MM-DD")).toBe("2080-03-31");

      const q4 = NepaliDate.getQuarter(4, 2080);
      expect(q4.start.format("YYYY-MM-DD")).toBe("2080-10-01");
      expect(q4.end.format("YYYY-MM-DD")).toBe("2080-12-30");
    });

    it("getQuarter rejects an out-of-range quarter", () => {
      expect(() => NepaliDate.getQuarter(5, 2080)).toThrow("Quarter must be an integer between 1 and 4");
    });

    it("getQuarters", () => {
      const quarters = NepaliDate.getQuarters(2080);
      expect(Object.keys(quarters)).toEqual(["Q1", "Q2", "Q3", "Q4"]);
      expect(quarters.Q1.start.format("YYYY-MM-DD")).toBe("2080-01-01");
    });

    it("getCurrentQuarter", () => {
      const d = new NepaliDate(2080, 0, 15);
      expect(d.getCurrentQuarter()).toBe(1);
    });

    it("getFiscalYearQuarter", () => {
      const fq1 = NepaliDate.getFiscalYearQuarter(1, 2080);
      expect(fq1.start.format("YYYY-MM-DD")).toBe("2080-04-01");
      expect(fq1.end.format("YYYY-MM-DD")).toBe("2080-06-30");

      const fq4 = NepaliDate.getFiscalYearQuarter(4, 2080);
      expect(fq4.start.format("YYYY-MM-DD")).toBe("2081-01-01");
      expect(fq4.end.format("YYYY-MM-DD")).toBe("2081-03-31");
    });

    it("getCurrentFiscalYearQuarter", () => {
      const d = new NepaliDate(2080, 0, 15); // Baisakh -> fiscal Q4
      expect(d.getCurrentFiscalYearQuarter()).toBe(4);

      const d2 = new NepaliDate(2080, 3, 15); // Shrawan -> fiscal Q1
      expect(d2.getCurrentFiscalYearQuarter()).toBe(1);
    });

    it("getFiscalYearQuarters", () => {
      const quarters = NepaliDate.getFiscalYearQuarters(2080);
      expect(Object.keys(quarters)).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    });
  });

  // -------------------------------------------------------------------
  // Static helpers
  // -------------------------------------------------------------------
  describe("static helpers", () => {
    it("getMonthName", () => {
      expect(NepaliDate.getMonthName(0)).toBe("Baisakh");
      expect(NepaliDate.getMonthName(0, true)).toBe("Bai");
      expect(NepaliDate.getMonthName(0, false, true)).toBe("बैशाख");
      expect(NepaliDate.getMonthName(0, true, true)).toBe("बै");
    });

    it("getMonthName rejects an out-of-range month", () => {
      expect(() => NepaliDate.getMonthName(12)).toThrow("Invalid month index, must be between 0-11");
    });

    it("getDayName", () => {
      expect(NepaliDate.getDayName(0)).toBe("Sunday");
      expect(NepaliDate.getDayName(0, true)).toBe("Sun");
      expect(NepaliDate.getDayName(0, false, true)).toBe("आइतबार");
      expect(NepaliDate.getDayName(0, true, true)).toBe("आइत");
    });

    it("isValid (static and instance)", () => {
      expect(NepaliDate.isValid(2080, 0, 31)).toBe(true);
      expect(NepaliDate.isValid(2080, 0, 32)).toBe(false);
      expect(NepaliDate.isValid(1800, 0, 1)).toBe(false);

      const d = new NepaliDate(2080, 0, 15);
      expect(d.isValid()).toBe(true);
    });

    it("getCalendarDays structure", () => {
      const cal = NepaliDate.getCalendarDays(2080, 0);

      expect(cal.prevRemainingDays).toBe(5);
      expect(cal.remainingDays).toBe(6);
      expect(cal.prevMonth).toEqual({ year: 2079, month: 11, days: [26, 27, 28, 29, 30] });
      expect(cal.nextMonth).toEqual({ year: 2080, month: 1, days: [1, 2, 3, 4, 5, 6] });
      expect(cal.currentMonth.days.length).toBe(31);
    });

    it("getCalendarDays rejects an invalid month", () => {
      expect(() => NepaliDate.getCalendarDays(2080, 12)).toThrow("Invalid year or month");
    });
  });
});
