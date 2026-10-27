import { describe, it, expect } from "vitest";
import { NepaliDate, BUNDLED_CONSTANTS } from "../src/index";
import type { NepaliConstants } from "../src/types";

describe("Pluggable Constants and Subclass Extension", () => {
  // Custom calendar extending into year 3000-3002
  const customCalendar: NepaliConstants = {
    ...BUNDLED_CONSTANTS,
    dateMap: [
      { year: 3000, days: [30, 31, 30, 31, 30, 31, 30, 31, 30, 31, 30, 31] }, // total 366 (leap)
      { year: 3001, days: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30] }, // total 360
      { year: 3002, days: [31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31] }, // total 372
    ],
    monthEn: [
      "Custom1",
      "Custom2",
      "Custom3",
      "Custom4",
      "Custom5",
      "Custom6",
      "Custom7",
      "Custom8",
      "Custom9",
      "Custom10",
      "Custom11",
      "Custom12",
    ],
  };

  class ExtendedNepaliDate extends NepaliDate {
    protected _getConstants(): NepaliConstants {
      return customCalendar;
    }
  }

  describe("Subclass Date Construction & Parsing", () => {
    it("constructs from string in custom calendar year range", () => {
      const d = new ExtendedNepaliDate("3000-02-15");
      expect(d.getYear()).toBe(3000);
      expect(d.getMonth()).toBe(1); // 0-indexed
      expect(d.getDate()).toBe(15);
      expect(d.format("YYYY-MM-DD")).toBe("3000-02-15");
    });

    it("constructs from year, month, day in custom range", () => {
      const d = new ExtendedNepaliDate(3001, 5, 20);
      expect(d.getYear()).toBe(3001);
      expect(d.getMonth()).toBe(5);
      expect(d.getDate()).toBe(20);
      expect(d.format("YYYY-MM-DD")).toBe("3001-06-20");
    });

    it("throws when string is out of custom calendar range", () => {
      // 2080 is not in the custom calendar range (3000-3002)
      expect(() => new ExtendedNepaliDate("2080-01-01")).toThrowError(
        "Nepal year out of range"
      );
    });

    it("throws when year integer is out of custom calendar range", () => {
      expect(() => new ExtendedNepaliDate(2080, 0, 1)).toThrowError(
        "Nepal year out of range!"
      );
    });

    it("throws when day exceeds custom month day limit", () => {
      // In year 3001, month 1 (index 0) has 30 days
      expect(() => new ExtendedNepaliDate("3001-01-31")).toThrowError(
        /Invalid nepali date/
      );
    });
  });

  describe("Subclass Calendar Calculations", () => {
    it("computes daysInMonth correctly from custom data", () => {
      const d = new ExtendedNepaliDate("3000-01-01");
      expect(d.daysInMonth()).toBe(30);
      expect(d.daysInMonth(3000, 1)).toBe(31);
      expect(d.daysInMonth(3001, 0)).toBe(30);
      expect(d.daysInMonth(3002, 0)).toBe(31);
    });

    it("evaluates isLeapYear based on custom totalDays calculation", () => {
      const leap = new ExtendedNepaliDate("3000-01-01");
      expect(leap.isLeapYear()).toBe(true); // 366 days

      const nonLeap = new ExtendedNepaliDate("3001-01-01");
      expect(nonLeap.isLeapYear()).toBe(false); // 360 days
    });

    it("correctly validates dates with isValid()", () => {
      const valid = new ExtendedNepaliDate("3000-01-10");
      expect(valid.isValid()).toBe(true);

      const invalidDay = new ExtendedNepaliDate("3000-01-30");
      // @ts-expect-error manually assigning day beyond custom month limit
      invalidDay.day = 32;
      expect(invalidDay.isValid()).toBe(false);
    });
  });

  describe("Subclass Date Arithmetic & Preservation of Instance Type", () => {
    it("adds months and returns a subclass instance", () => {
      const d = new ExtendedNepaliDate("3000-01-15");
      const nextMonth = d.addMonths(2);

      expect(nextMonth).toBeInstanceOf(ExtendedNepaliDate);
      expect(nextMonth.format("YYYY-MM-DD")).toBe("3000-03-15");
    });

    it("adds years and returns a subclass instance", () => {
      const d = new ExtendedNepaliDate("3000-05-10");
      const nextYear = d.addYears(1);

      expect(nextYear).toBeInstanceOf(ExtendedNepaliDate);
      expect(nextYear.format("YYYY-MM-DD")).toBe("3001-05-10");
    });

    it("clamps day when adding months to a month with fewer days", () => {
      // 3000-02 has 31 days, but 3000-03 (index 2) has 30 days
      const d = new ExtendedNepaliDate("3000-02-31");
      const nextMonth = d.addMonths(1);

      expect(nextMonth.format("YYYY-MM-DD")).toBe("3000-03-30");
    });

    it("computes endOfYear according to custom last month days", () => {
      const d = new ExtendedNepaliDate("3000-01-01");
      const end = d.endOfYear();

      expect(end).toBeInstanceOf(ExtendedNepaliDate);
      // month 12 (index 11) has 31 days in year 3000
      expect(end.format("YYYY-MM-DD")).toBe("3000-12-31");
    });
  });

  describe("Subclass Formatting with Custom Labels", () => {
    it("formats with custom month names", () => {
      const d = new ExtendedNepaliDate("3000-01-01");
      expect(d.format("MMMM YYYY")).toBe("Custom1 3000");

      const d2 = new ExtendedNepaliDate("3000-05-01");
      expect(d2.format("MMMM")).toBe("Custom5");
    });
  });

  describe("Dynamic Runtime Updating of Constants", () => {
    let currentData = { ...customCalendar };

    class DynamicNepaliDate extends NepaliDate {
      protected _getConstants(): NepaliConstants {
        return currentData;
      }
    }

    it("detects when custom constants reference updates", () => {
      const d = new DynamicNepaliDate("3000-01-01");
      expect(d.daysInMonth()).toBe(30);

      // Simulate runtime update (e.g., from an API update)
      currentData = {
        ...customCalendar,
        dateMap: [
          { year: 3000, days: [32, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30] },
          ...customCalendar.dateMap.slice(1),
        ],
      };

      // Same instance dynamically reflects the updated calendar constants
      expect(d.daysInMonth()).toBe(32);
    });
  });
});

