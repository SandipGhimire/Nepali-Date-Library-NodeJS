import { describe, expect, it } from "vitest";
import { ADtoBS, BStoAD, BUNDLED_CONSTANTS, NepaliDate, defineConstants, validateConstants } from "../src/index";
import { findYearIndex, processConstants } from "../src/Helper/Utils";
import type { NepaliConstants } from "../src/types";

const DAY_MS = 86400000;
const DEFAULT_EPOCH = BUNDLED_CONSTANTS.epoch;

const range = (n: number, fn: (i: number) => string): string[] => Array.from({ length: n }, (_, i) => fn(i));

/** 3000 = 366 days, 3001 = 360 days, 3002 = 372 days. Years longer than 366 days used to break lookups. */
const CAL = defineConstants({
  dateMap: [
    { year: 3000, days: [30, 31, 30, 31, 30, 31, 30, 31, 30, 31, 30, 31] },
    { year: 3001, days: Array<number>(12).fill(30) },
    { year: 3002, days: Array<number>(12).fill(31) },
  ],
  weekEn: range(7, (i) => `Day${String(i)}`),
  weekShortEn: range(7, (i) => `D${String(i)}`),
  weekNp: range(7, (i) => `NpDay${String(i)}`),
  weekShortNp: range(7, (i) => `ND${String(i)}`),
  monthEn: range(12, (i) => `Month${String(i + 1)}`),
  monthShortEn: range(12, (i) => `M${String(i + 1)}`),
  monthNp: range(12, (i) => `NpMonth${String(i + 1)}`),
  monthShortNp: range(12, (i) => `NM${String(i + 1)}`),
  numberNp: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
});

class Cal extends NepaliDate {
  protected static override constants(): NepaliConstants {
    return CAL;
  }
}

const adOf = (daysSinceEpoch: number, epoch = DEFAULT_EPOCH): string =>
  new Date(epoch + daysSinceEpoch * DAY_MS).toISOString().slice(0, 10);

describe("defineConstants()", () => {
  it("returns a complete copy of the bundled data when called with no overrides", () => {
    const c = defineConstants();

    expect(c.epoch).toBe(BUNDLED_CONSTANTS.epoch);
    expect(c.utcOffsetMs).toBe(BUNDLED_CONSTANTS.utcOffsetMs);
    expect(c.monthEn).toEqual(BUNDLED_CONSTANTS.monthEn);
    expect(c.numberNp).toEqual(BUNDLED_CONSTANTS.numberNp);
    expect(c.dateMap).toHaveLength(BUNDLED_CONSTANTS.dateMap.length);
    expect(c.dateMap[0]).toEqual({ year: 1976, days: BUNDLED_CONSTANTS.dateMap[0].days });
  });

  it("never shares arrays with the bundled data or with the caller's input", () => {
    const c = defineConstants();
    expect(c.dateMap).not.toBe(BUNDLED_CONSTANTS.dateMap);
    expect(c.dateMap[0].days).not.toBe(BUNDLED_CONSTANTS.dateMap[0].days);
    expect(c.monthEn).not.toBe(BUNDLED_CONSTANTS.monthEn);

    const mine = range(12, (i) => `X${String(i)}`);
    const d = defineConstants({ monthEn: mine });
    mine[0] = "changed";
    expect(d.monthEn[0]).toBe("X0");
  });

  it("falls back to bundled values for anything not overridden", () => {
    const c = defineConstants({ monthEn: range(12, (i) => `X${String(i)}`) });
    expect(c.monthEn[0]).toBe("X0");
    expect(c.weekEn).toEqual(BUNDLED_CONSTANTS.weekEn);
    expect(c.dateMap).toHaveLength(BUNDLED_CONSTANTS.dateMap.length);
  });

  it("ignores explicitly undefined overrides", () => {
    const c = defineConstants({ monthEn: undefined });
    expect(c.monthEn).toEqual(BUNDLED_CONSTANTS.monthEn);
  });

  it("accepts the processed bundled date map and appends extra years", () => {
    const c = defineConstants({
      dateMap: [...BUNDLED_CONSTANTS.dateMap, { year: 2101, days: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] }],
    });
    expect(c.dateMap).toHaveLength(BUNDLED_CONSTANTS.dateMap.length + 1);
    expect(c.dateMap[c.dateMap.length - 1].year).toBe(2101);
    // processed-only fields are stripped from the raw output
    expect(Object.keys(c.dateMap[0]).sort()).toEqual(["days", "year"]);
  });

  it("rejects unknown keys so typos do not pass silently", () => {
    expect(() => defineConstants({ monthEN: [] } as unknown as Partial<NepaliConstants>)).toThrowError(
      /unknown key "monthEN"/
    );
  });

  it("validates the merged result", () => {
    expect(() => defineConstants({ monthEn: ["only", "two"] })).toThrowError(/monthEn must be an array of exactly 12/);
  });
});

describe("validateConstants()", () => {
  const withOverride = (override: Record<string, unknown>): NepaliConstants =>
    ({ ...BUNDLED_CONSTANTS, ...override }) as unknown as NepaliConstants;
  const goodYear = (year: number): { year: number; days: number[] } => ({ year, days: Array<number>(12).fill(30) });

  it("accepts the bundled constants", () => {
    expect(() => {
      validateConstants(BUNDLED_CONSTANTS);
    }).not.toThrow();
  });

  it("accepts 32-day months and a custom non-zero offset", () => {
    expect(() => {
      validateConstants(
        withOverride({ dateMap: [{ year: 1, days: Array<number>(12).fill(32) }], utcOffsetMs: -3600000 })
      );
    }).not.toThrow();
  });

  it.each<[string, Record<string, unknown>, RegExp]>([
    ["empty dateMap", { dateMap: [] }, /dateMap must be a non-empty array/],
    ["dateMap not an array", { dateMap: "nope" }, /dateMap must be a non-empty array/],
    ["non-integer year", { dateMap: [{ year: "x", days: Array<number>(12).fill(30) }] }, /year must be an integer/],
    ["entry not an object", { dateMap: [42] }, /year must be an integer/],
    [
      "gap between years",
      { dateMap: [goodYear(3000), goodYear(3002)] },
      /consecutive, expected 3001 at index 1 but got 3002/,
    ],
    ["years out of order", { dateMap: [goodYear(3001), goodYear(3000)] }, /consecutive/],
    ["too few months", { dateMap: [{ year: 3000, days: [30, 30] }] }, /exactly 12 month lengths/],
    ["too many months", { dateMap: [{ year: 3000, days: Array<number>(13).fill(30) }] }, /exactly 12 month lengths/],
    ["days not an array", { dateMap: [{ year: 3000, days: "30" }] }, /exactly 12 month lengths/],
    ["zero-day month", { dateMap: [{ year: 3000, days: [0, ...Array<number>(11).fill(30)] }] }, /month 1 of year 3000/],
    ["33-day month", { dateMap: [{ year: 3000, days: [...Array<number>(11).fill(30), 33] }] }, /month 12 of year 3000/],
    ["fractional days", { dateMap: [{ year: 3000, days: [30.5, ...Array<number>(11).fill(30)] }] }, /month 1/],
    ["string days", { dateMap: [{ year: 3000, days: ["30", ...Array<number>(11).fill(30)] }] }, /month 1/],
    ["NaN days", { dateMap: [{ year: 3000, days: [NaN, ...Array<number>(11).fill(30)] }] }, /month 1/],
    ["fractional epoch", { epoch: 1.5 }, /epoch must be an integer/],
    ["NaN epoch", { epoch: NaN }, /epoch must be an integer/],
    ["string epoch", { epoch: "abc" }, /epoch must be an integer/],
    ["epoch not on UTC midnight", { epoch: DEFAULT_EPOCH + 1 }, /UTC midnight/],
    ["NaN offset", { utcOffsetMs: NaN }, /utcOffsetMs must be a finite number/],
    ["Infinity offset", { utcOffsetMs: Infinity }, /utcOffsetMs must be a finite number/],
    ["string offset", { utcOffsetMs: "5" }, /utcOffsetMs must be a finite number/],
    ["weekEn too short", { weekEn: ["a"] }, /weekEn must be an array of exactly 7/],
    ["weekShortEn too long", { weekShortEn: range(8, String) }, /weekShortEn must be an array of exactly 7/],
    ["weekNp missing", { weekNp: undefined }, /weekNp must be an array of exactly 7/],
    ["weekShortNp wrong", { weekShortNp: range(6, String) }, /weekShortNp must be an array of exactly 7/],
    ["monthEn wrong size", { monthEn: range(11, String) }, /monthEn must be an array of exactly 12/],
    ["monthShortEn wrong size", { monthShortEn: range(13, String) }, /monthShortEn must be an array of exactly 12/],
    ["monthNp wrong size", { monthNp: [] }, /monthNp must be an array of exactly 12/],
    ["monthShortNp wrong size", { monthShortNp: range(1, String) }, /monthShortNp must be an array of exactly 12/],
    ["numberNp wrong size", { numberNp: range(9, String) }, /numberNp must be an array of exactly 10/],
    ["numeric entry in names", { monthEn: [1, ...range(11, String)] }, /monthEn must only contain strings/],
  ])("rejects %s", (_name, override, pattern) => {
    expect(() => {
      validateConstants(withOverride(override));
    }).toThrowError(pattern);
  });

  it("rejects non-object input", () => {
    expect(() => {
      validateConstants(null as unknown as NepaliConstants);
    }).toThrowError(/constants must be an object/);
    expect(() => {
      validateConstants([] as unknown as NepaliConstants);
    }).toThrowError(/constants must be an object/);
  });

  it("prefixes every message so the source is obvious", () => {
    expect(() => {
      validateConstants(withOverride({ epoch: NaN }));
    }).toThrowError(/^Invalid Nepali constants: /);
  });
});

describe("processConstants()", () => {
  it("computes totalDays and daysTillNow cumulatively", () => {
    const p = processConstants(CAL);
    expect(p.dateMap.map((e) => e.totalDays)).toEqual([366, 360, 372]);
    expect(p.dateMap.map((e) => e.daysTillNow)).toEqual([366, 726, 1098]);
  });

  it("returns a deeply frozen snapshot", () => {
    const p = processConstants(CAL);
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.dateMap)).toBe(true);
    expect(Object.isFrozen(p.dateMap[0])).toBe(true);
    expect(Object.isFrozen(p.dateMap[0].days)).toBe(true);
    expect(Object.isFrozen(p.monthEn)).toBe(true);
    expect(() => {
      p.monthEn[0] = "nope";
    }).toThrow();
  });

  it("does not freeze or alias the caller's input", () => {
    const raw = defineConstants({ dateMap: [{ year: 1, days: Array<number>(12).fill(30) }] });
    const p = processConstants(raw);
    expect(Object.isFrozen(raw)).toBe(false);
    expect(Object.isFrozen(raw.dateMap[0].days)).toBe(false);
    expect(p.dateMap[0].days).not.toBe(raw.dateMap[0].days);
  });

  it("validates before processing", () => {
    expect(() => processConstants({ ...BUNDLED_CONSTANTS, epoch: NaN })).toThrowError(/epoch/);
  });
});

describe("findYearIndex()", () => {
  const { dateMap } = processConstants(CAL);

  it("finds the year block for boundary offsets", () => {
    expect(findYearIndex(dateMap, 0)).toBe(0);
    expect(findYearIndex(dateMap, 365)).toBe(0);
    expect(findYearIndex(dateMap, 366)).toBe(1);
    expect(findYearIndex(dateMap, 725)).toBe(1);
    expect(findYearIndex(dateMap, 726)).toBe(2);
    expect(findYearIndex(dateMap, 1097)).toBe(2);
  });

  it("agrees with a linear scan over every day of the bundled calendar", () => {
    const bundled = BUNDLED_CONSTANTS.dateMap;
    const last = bundled[bundled.length - 1].daysTillNow;
    for (let d = 0; d < last; d += 1) {
      let expected = 0;
      while (d >= bundled[expected].daysTillNow) expected += 1;
      expect(findYearIndex(bundled, d)).toBe(expected);
    }
  });

  it("works for a single-year calendar", () => {
    const single = processConstants(
      defineConstants({ dateMap: [{ year: 5, days: Array<number>(12).fill(30) }] })
    ).dateMap;
    expect(findYearIndex(single, 0)).toBe(0);
    expect(findYearIndex(single, 359)).toBe(0);
  });
});

describe("Bundled constants protection", () => {
  it("are frozen so one bad write cannot corrupt every date", () => {
    expect(Object.isFrozen(BUNDLED_CONSTANTS)).toBe(true);
    expect(Object.isFrozen(BUNDLED_CONSTANTS.dateMap)).toBe(true);
    expect(Object.isFrozen(BUNDLED_CONSTANTS.dateMap[0])).toBe(true);
    expect(Object.isFrozen(BUNDLED_CONSTANTS.dateMap[0].days)).toBe(true);
    expect(Object.isFrozen(BUNDLED_CONSTANTS.monthEn)).toBe(true);
    expect(() => {
      (BUNDLED_CONSTANTS.dateMap as unknown[]).push({});
    }).toThrow();
    expect(() => {
      BUNDLED_CONSTANTS.dateMap[0].days[0] = 99;
    }).toThrow();
  });

  it("still drive the default class unchanged", () => {
    expect(NepaliDate.getConstants()).toBe(BUNDLED_CONSTANTS);
    expect(new NepaliDate(2080, 0, 1).getConstants()).toBe(BUNDLED_CONSTANTS);
    expect(new NepaliDate("2080-01-01").format("YYYY-MM-DD")).toBe("2080-01-01");
  });
});

describe("Constants resolution and caching", () => {
  it("returns the same processed object on every call, for the class and its instances", () => {
    const first = Cal.getConstants();
    expect(Cal.getConstants()).toBe(first);
    expect(new Cal(3000, 0, 1).getConstants()).toBe(first);
    expect(new Cal(3001, 0, 1).getConstants()).toBe(first);
  });

  it("shares one snapshot between classes that return the same raw object", () => {
    class Other extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return CAL;
      }
    }
    expect(Other.getConstants()).toBe(Cal.getConstants());
  });

  it("keeps different calendars isolated from each other and from the default", () => {
    const small = defineConstants({ dateMap: [{ year: 10, days: Array<number>(12).fill(29) }] });
    class Small extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return small;
      }
    }
    expect(Small.getConstants()).not.toBe(Cal.getConstants());
    expect(NepaliDate.getConstants()).toBe(BUNDLED_CONSTANTS);
    expect(new Small(10, 0, 1).daysInMonth()).toBe(29);
    expect(new Cal(3000, 0, 1).daysInMonth()).toBe(30);
    expect(new NepaliDate(2080, 0, 1).daysInMonth()).toBe(31);
  });

  it("snapshots on first use: mutating the raw object later changes nothing", () => {
    const raw = defineConstants({ dateMap: [{ year: 1, days: Array<number>(12).fill(30) }] });
    class Snap extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return raw;
      }
    }
    const before = Snap.getConstants();
    raw.dateMap[0].days[0] = 32;
    raw.monthEn[0] = "Hacked";

    expect(Snap.getConstants()).toBe(before);
    expect(new Snap(1, 0, 1).daysInMonth()).toBe(30);
    expect(new Snap(1, 0, 1).format("MMMM")).toBe("Baisakh");
  });

  it("picks up a replaced constants object on the next call", () => {
    let current = defineConstants({ dateMap: [{ year: 1, days: Array<number>(12).fill(30) }] });
    class Swap extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return current;
      }
    }
    const d = new Swap(1, 0, 1);
    expect(d.daysInMonth()).toBe(30);

    current = defineConstants({ dateMap: [{ year: 1, days: Array<number>(12).fill(31) }] });
    expect(d.daysInMonth()).toBe(31);
  });

  it("stays correct (just slower) when the hook returns a fresh object every call", () => {
    class Fresh extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return defineConstants({ dateMap: [{ year: 7, days: Array<number>(12).fill(30) }] });
      }
    }
    const d = new Fresh(7, 2, 3);
    expect(d.format("YYYY-MM-DD")).toBe("7-03-03");
    expect(d.daysInMonth()).toBe(30);
  });

  it("lets the hook read static class fields, which instance fields could not do", () => {
    class Configurable extends NepaliDate {
      static calendar: NepaliConstants = CAL;
      protected static override constants(): NepaliConstants {
        return this.calendar;
      }
    }
    expect(new Configurable(3000, 0, 1).year).toBe(3000);

    const alt = defineConstants({ dateMap: [{ year: 50, days: Array<number>(12).fill(30) }] });
    class AltConfigurable extends Configurable {
      static override calendar = alt;
    }
    expect(new AltConfigurable(50, 0, 1).year).toBe(50);
    expect(() => new AltConfigurable(3000, 0, 1)).toThrowError(/out of range/);
    // the parent keeps its own calendar
    expect(new Configurable(3000, 0, 1).year).toBe(3000);
  });

  it("supports a subclass of a subclass overriding again", () => {
    const other = defineConstants({ dateMap: [{ year: 77, days: Array<number>(12).fill(30) }] });
    class Child extends Cal {
      protected static override constants(): NepaliConstants {
        return other;
      }
    }
    expect(new Child(77, 0, 1).year).toBe(77);
    expect(() => new Child(3000, 0, 1)).toThrowError(/out of range/);
    expect(new Cal(3000, 0, 1).year).toBe(3000);
  });

  it("subclass that does not override keeps the parent's calendar", () => {
    class Plain extends Cal {}
    expect(Plain.getConstants()).toBe(Cal.getConstants());
    expect(new Plain(3002, 3, 4).format("YYYY-MM-DD")).toBe("3002-04-04");
  });
});

describe("Invalid constants in a subclass", () => {
  class Broken extends NepaliDate {
    protected static override constants(): NepaliConstants {
      return { ...BUNDLED_CONSTANTS, dateMap: [{ year: 3000, days: [30, 30] }] };
    }
  }

  it("fail fast with a readable message instead of a cryptic TypeError", () => {
    expect(() => new Broken(3000, 0, 1)).toThrowError(/Invalid Nepali constants: .*exactly 12 month lengths/);
    expect(() => new Broken("3000-01-01")).toThrowError(/Invalid Nepali constants/);
    expect(() => new Broken()).toThrowError(/Invalid Nepali constants/);
    expect(() => Broken.getConstants()).toThrowError(/Invalid Nepali constants/);
    expect(() => Broken.getMonthName(0)).toThrowError(/Invalid Nepali constants/);
    // a broken calendar is reported, not silently treated as "date is invalid"
    expect(() => Broken.isValid(3000, 0, 1)).toThrowError(/Invalid Nepali constants/);
    expect(() => Broken.getCalendarDays(3000, 0)).toThrowError(/Invalid Nepali constants/);
  });

  it("do not poison other classes", () => {
    expect(() => new Broken(3000, 0, 1)).toThrow();
    expect(new NepaliDate(2080, 0, 1).format("YYYY-MM-DD")).toBe("2080-01-01");
    expect(new Cal(3000, 0, 1).format("YYYY-MM-DD")).toBe("3000-01-01");
  });
});

describe("Construction and parsing on a custom calendar", () => {
  it("builds from year/month/day", () => {
    const d = new Cal(3001, 5, 20);
    expect([d.getYear(), d.getMonth(), d.getDate()]).toEqual([3001, 5, 20]);
    expect(d.format("YYYY-MM-DD")).toBe("3001-06-20");
  });

  it.each(["3000-02-15", "3000/02/15", "3000.02.15", "3000-2-15"])("parses %s", (s) => {
    const d = new Cal(s);
    expect([d.year, d.month, d.day]).toEqual([3000, 1, 15]);
  });

  it("defaults a partial string to month 1, day 1", () => {
    expect(new Cal("3001").format("YYYY-MM-DD")).toBe("3001-01-01");
    expect(new Cal("3001-04").format("YYYY-MM-DD")).toBe("3001-04-01");
  });

  it("rejects strings outside the custom range", () => {
    expect(() => new Cal("2080-01-01")).toThrowError("Nepal year out of range");
    expect(() => new Cal("2999-12-30")).toThrowError("Nepal year out of range");
    expect(() => new Cal("3003-01-01")).toThrowError("Nepal year out of range");
  });

  it("rejects numeric dates outside the custom range", () => {
    expect(() => new Cal(2080, 0, 1)).toThrowError("Nepal year out of range!");
    expect(() => new Cal(3003, 0, 1)).toThrowError("Nepal year out of range!");
  });

  it("uses the custom month lengths when validating days and months", () => {
    expect(() => new Cal("3001-01-31")).toThrowError(/Invalid nepali date/);
    expect(new Cal("3002-01-31").getDate()).toBe(31);
    expect(() => new Cal("3000-13-01")).toThrowError(/Invalid nepali month/);
    expect(() => new Cal("3000-00-01")).toThrowError(/Invalid nepali month/);
    expect(() => new Cal("3000-01-00")).toThrowError(/Invalid nepali date/);
    expect(() => new Cal("garbage")).toThrowError("Invalid date");
  });

  it("parse() updates an instance using the custom calendar", () => {
    const d = new Cal(3000, 0, 1);
    d.parse("3001/03/04");
    expect(d.format("YYYY-MM-DD")).toBe("3001-03-04");
    expect(() => {
      d.parse("2080-01-01");
    }).toThrowError("Nepal year out of range");
  });

  it("set() rolls months over and handles negative months", () => {
    const d = new Cal(3000, 0, 1);
    d.set(3000, 12, 1);
    expect(d.format("YYYY-MM-DD")).toBe("3001-01-01");
    d.set(3001, -1, 1);
    expect(d.format("YYYY-MM-DD")).toBe("3000-12-01");
  });

  it("setYear / setMonth / setDate go through the custom calendar", () => {
    const d = new Cal(3000, 1, 31);
    d.setYear(3002);
    expect(d.format("YYYY-MM-DD")).toBe("3002-02-31");
    d.setMonth(5);
    expect(d.format("YYYY-MM-DD")).toBe("3002-06-31");
    d.setDate(1);
    expect(d.format("YYYY-MM-DD")).toBe("3002-06-01");
  });

  it("converts the epoch day to the first custom day", () => {
    const d = new Cal(new Date(DEFAULT_EPOCH));
    expect(d.format("YYYY-MM-DD")).toBe("3000-01-01");
  });

  it("throws for instants before the epoch or after the last day", () => {
    expect(() => new Cal(new Date(DEFAULT_EPOCH - DAY_MS))).toThrowError("Date is out of supported range");
    expect(() => new Cal(new Date(DEFAULT_EPOCH + 1098 * DAY_MS))).toThrowError("Date is out of supported range");
    expect(new Cal(new Date(DEFAULT_EPOCH + 1097 * DAY_MS)).format("YYYY-MM-DD")).toBe("3002-12-31");
  });

  it("a numeric timestamp is treated as a Unix time in ms", () => {
    expect(new Cal(DEFAULT_EPOCH + 5 * DAY_MS).format("YYYY-MM-DD")).toBe("3000-01-06");
  });

  it("rejects invalid argument types", () => {
    expect(() => new Cal({} as unknown as Date)).toThrowError("Invalid argument syntax");
    expect(() => new Cal(true as unknown as number)).toThrowError("Invalid argument syntax");
  });
});

describe("Year lookup with long years (regression for >366-day years)", () => {
  it("round-trips every single day of a calendar whose years have 372 days", () => {
    const long = defineConstants({
      dateMap: [3000, 3001, 3002, 3003, 3004].map((year) => ({ year, days: Array<number>(12).fill(31) })),
    });
    class Long extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return long;
      }
    }
    let count = 0;
    for (let y = 3000; y <= 3004; y += 1) {
      for (let m = 0; m < 12; m += 1) {
        for (let d = 1; d <= 31; d += 1) {
          const date = new Long(y, m, d);
          expect([date.year, date.month, date.day]).toEqual([y, m, d]);
          count += 1;
        }
      }
    }
    expect(count).toBe(5 * 372);
  });

  it("round-trips every day of the mixed 366/360/372 calendar through timestamps", () => {
    for (let n = 0; n < 1098; n += 1) {
      const fromTimestamp = new Cal(new Date(DEFAULT_EPOCH + n * DAY_MS));
      const fromFields = new Cal(fromTimestamp.year, fromTimestamp.month, fromTimestamp.day);
      expect(fromFields.getTime()).toBe(DEFAULT_EPOCH + n * DAY_MS);
    }
  });

  it("walks forward one day at a time without gaps or repeats", () => {
    let d = new Cal(3000, 0, 1);
    const seen = new Set<string>([d.toString()]);
    for (let n = 1; n < 1098; n += 1) {
      d = d.addDays(1);
      expect(seen.has(d.toString())).toBe(false);
      seen.add(d.toString());
    }
    expect(d.format("YYYY-MM-DD")).toBe("3002-12-31");
    expect(seen.size).toBe(1098);
  });

  it("still converts the bundled calendar correctly after the lookup rewrite", () => {
    expect(new NepaliDate(new Date(Date.UTC(2023, 3, 14))).format("YYYY-MM-DD")).toBe("2080-01-01");
    expect(new NepaliDate(new Date(DEFAULT_EPOCH)).format("YYYY-MM-DD")).toBe("1976-01-01");
    expect(new NepaliDate(new Date(NepaliDate.maximum().getTime())).format("YYYY-MM-DD")).toBe("2100-12-31");
  });
});

describe("Static methods honour the subclass calendar", () => {
  it("getMonthName", () => {
    expect(Cal.getMonthName(0)).toBe("Month1");
    expect(Cal.getMonthName(11)).toBe("Month12");
    expect(Cal.getMonthName(0, true)).toBe("M1");
    expect(Cal.getMonthName(0, false, true)).toBe("NpMonth1");
    expect(Cal.getMonthName(0, true, true)).toBe("NM1");
    expect(NepaliDate.getMonthName(0)).toBe("Baisakh");
  });

  it("getDayName", () => {
    expect(Cal.getDayName(0)).toBe("Day0");
    expect(Cal.getDayName(6, true)).toBe("D6");
    expect(Cal.getDayName(1, false, true)).toBe("NpDay1");
    expect(Cal.getDayName(1, true, true)).toBe("ND1");
    expect(NepaliDate.getDayName(0)).toBe("Sunday");
  });

  it("name lookups still validate their index", () => {
    expect(() => Cal.getMonthName(12)).toThrowError("Invalid month index");
    expect(() => Cal.getMonthName(-1)).toThrowError("Invalid month index");
    expect(() => Cal.getDayName(7)).toThrowError("Invalid day index");
  });

  it("isValid", () => {
    expect(Cal.isValid(3000, 0, 1)).toBe(true);
    expect(Cal.isValid(3002, 5, 31)).toBe(true);
    expect(Cal.isValid(3001, 0, 31)).toBe(false);
    expect(Cal.isValid(3000, 0, 0)).toBe(false);
    expect(Cal.isValid(3000, 12, 1)).toBe(false);
    expect(Cal.isValid(3000, -1, 1)).toBe(false);
    expect(Cal.isValid(2999, 0, 1)).toBe(false);
    expect(Cal.isValid(3003, 0, 1)).toBe(false);
    // and the default class does not know the custom years
    expect(NepaliDate.isValid(3000, 0, 1)).toBe(false);
    expect(NepaliDate.isValid(2080, 0, 31)).toBe(true);
  });

  it("minimum / maximum", () => {
    expect(Cal.minimum().getTime()).toBe(DEFAULT_EPOCH);
    expect(Cal.maximum().getTime()).toBe(DEFAULT_EPOCH + 1097 * DAY_MS);
    expect(Cal.maximum().toISOString().slice(0, 10)).toBe(adOf(1097));
  });

  it("minimum / maximum follow a custom epoch", () => {
    const epoch = Date.UTC(2000, 0, 1);
    const custom = defineConstants({ epoch, dateMap: [{ year: 1, days: Array<number>(12).fill(30) }] });
    class E extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return custom;
      }
    }
    expect(E.minimum().getTime()).toBe(epoch);
    expect(E.maximum().getTime()).toBe(epoch + 359 * DAY_MS);
  });

  it("getCalendarDays builds the grid from the custom calendar", () => {
    const grid = Cal.getCalendarDays(3001, 0);
    // 3001-01-01 is 366 days after the epoch (a Sunday), so a Tuesday
    expect(grid.prevRemainingDays).toBe(2);
    expect(grid.prevMonth).toEqual({ year: 3000, month: 11, days: [30, 31] });
    expect(grid.currentMonth.year).toBe(3001);
    expect(grid.currentMonth.days).toHaveLength(30);
    expect(grid.remainingDays).toBe(42 - 2 - 30);
    expect(grid.nextMonth.year).toBe(3001);
    expect(grid.nextMonth.month).toBe(1);
    expect(grid.nextMonth.days).toHaveLength(10);
  });

  it("getCalendarDays at the calendar edges leaves the missing neighbour empty", () => {
    const first = Cal.getCalendarDays(3000, 0);
    expect(first.prevRemainingDays).toBe(0);
    expect(first.prevMonth).toEqual({ year: 0, month: 0, days: [] });

    const last = Cal.getCalendarDays(3002, 11);
    expect(last.nextMonth).toEqual({ year: 0, month: 0, days: [] });
  });

  it("getCalendarDays rejects months the custom calendar does not have", () => {
    expect(() => Cal.getCalendarDays(2080, 0)).toThrowError("Invalid year or month");
    expect(() => Cal.getCalendarDays(3003, 0)).toThrowError("Invalid year or month");
    expect(() => Cal.getCalendarDays(3000, 12)).toThrowError("Invalid year or month");
    expect(() => NepaliDate.getCalendarDays(3000, 0)).toThrowError("Invalid year or month");
  });

  it("getQuarter / getQuarters return subclass instances for an explicit year", () => {
    const q1 = Cal.getQuarter(1, 3001);
    expect(q1.start).toBeInstanceOf(Cal);
    expect(q1.start.format("YYYY-MM-DD")).toBe("3001-01-01");
    expect(q1.end.format("YYYY-MM-DD")).toBe("3001-03-30");

    const all = Cal.getQuarters(3002);
    expect(Object.keys(all)).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    expect(all.Q4.start.format("YYYY-MM-DD")).toBe("3002-10-01");
    expect(all.Q4.end.format("YYYY-MM-DD")).toBe("3002-12-31");
    expect(all.Q4.end).toBeInstanceOf(Cal);
  });

  it("getFiscalYearQuarter(s) cross into the next custom year", () => {
    const q1 = Cal.getFiscalYearQuarter(1, 3000);
    expect(q1.start.format("YYYY-MM-DD")).toBe("3000-04-01");
    expect(q1.end.format("YYYY-MM-DD")).toBe("3000-06-31");

    const q4 = Cal.getFiscalYearQuarter(4, 3000);
    expect(q4.start.format("YYYY-MM-DD")).toBe("3001-01-01");
    expect(q4.end.format("YYYY-MM-DD")).toBe("3001-03-30");

    const all = Cal.getFiscalYearQuarters(3000);
    expect(all.Q3.start.format("YYYY-MM-DD")).toBe("3000-10-01");
    expect(all.Q3.start).toBeInstanceOf(Cal);
  });

  it("fiscal quarters that would leave the custom range throw", () => {
    expect(() => Cal.getFiscalYearQuarter(4, 3002)).toThrowError("Nepal year out of range!");
    expect(() => Cal.getQuarter(1, 2080)).toThrowError("Nepal year out of range!");
    expect(() => Cal.getQuarter(5, 3000)).toThrowError("Quarter must be an integer between 1 and 4");
    expect(() => Cal.getFiscalYearQuarter(0, 3000)).toThrowError("Quarter must be an integer between 1 and 4");
  });

  it("current-date helpers throw clearly when today is outside the custom range", () => {
    expect(() => Cal.getCurrentFiscalYear()).toThrowError("Date is out of supported range");
    expect(() => Cal.getQuarter(1)).toThrowError("Date is out of supported range");
  });

  it("detached static calls fall back to the default calendar instead of crashing", () => {
    const { isValid, getMonthName } = Cal;
    expect(isValid(2080, 0, 1)).toBe(true);
    expect(isValid(3000, 0, 1)).toBe(false);
    expect(getMonthName(0)).toBe("Baisakh");
    const bound = Cal.isValid.bind(Cal);
    expect(bound(3000, 0, 1)).toBe(true);
  });
});

describe("Instance behaviour on a custom calendar", () => {
  it("daysInMonth / isLeapYear / isValid use the custom data", () => {
    const d = new Cal(3000, 0, 1);
    expect(d.daysInMonth()).toBe(30);
    expect(d.daysInMonth(3000, 1)).toBe(31);
    expect(d.daysInMonth(3001, 0)).toBe(30);
    expect(d.daysInMonth(3002, 5)).toBe(31);
    expect(d.isLeapYear()).toBe(true);
    expect(new Cal(3001, 0, 1).isLeapYear()).toBe(false);
    expect(new Cal(3002, 0, 1).isLeapYear()).toBe(true);
    expect(d.isValid()).toBe(true);
  });

  it("daysInMonth throws a clear error for years outside the calendar", () => {
    const d = new Cal(3000, 0, 1);
    expect(() => d.daysInMonth(3003)).toThrowError("Year is out of supported range");
    expect(() => d.daysInMonth(2080)).toThrowError("Year is out of supported range");
    expect(() => d.daysInMonth(3000, 12)).toThrowError("Invalid month index");
  });

  it("isValid() reports tampered fields", () => {
    const d = new Cal(3001, 0, 1);
    d.day = 31;
    expect(d.isValid()).toBe(false);
    d.day = 30;
    expect(d.isValid()).toBe(true);
    d.month = 12;
    expect(d.isValid()).toBe(false);
    d.month = 0;
    d.year = 3003;
    expect(d.isValid()).toBe(false);
    d.year = 2999;
    expect(d.isValid()).toBe(false);
  });

  it("getDay follows the epoch weekday", () => {
    expect(new Cal(3000, 0, 1).getDay()).toBe(0);
    expect(new Cal(3000, 0, 2).getDay()).toBe(1);
    expect(new Cal(3000, 1, 5).getDay()).toBe(6);
    expect(new Cal(3001, 0, 1).getDay()).toBe(2);
  });

  it("getWeeksInMonth", () => {
    expect(new Cal(3001, 0, 10).getWeeksInMonth()).toBe(5);
    expect(new Cal(3000, 0, 1).getWeeksInMonth()).toBe(5);
  });

  it("addDays returns a subclass instance and crosses year boundaries", () => {
    const d = new Cal(3000, 11, 31).addDays(1);
    expect(d).toBeInstanceOf(Cal);
    expect(d.format("YYYY-MM-DD")).toBe("3001-01-01");
    expect(new Cal(3001, 0, 1).addDays(-1).format("YYYY-MM-DD")).toBe("3000-12-31");
    expect(() => new Cal(3002, 11, 31).addDays(1)).toThrowError("Date is out of supported range");
    expect(() => new Cal(3000, 0, 1).addDays(-1)).toThrowError("Date is out of supported range");
  });

  it("addMonths clamps to the target month's custom length", () => {
    const next = new Cal(3000, 11, 31).addMonths(1);
    expect(next).toBeInstanceOf(Cal);
    expect(next.format("YYYY-MM-DD")).toBe("3001-01-30");
    expect(new Cal(3000, 1, 31).addMonths(1).format("YYYY-MM-DD")).toBe("3000-03-30");
    expect(new Cal(3001, 5, 15).addMonths(-6).format("YYYY-MM-DD")).toBe("3000-12-15");
    expect(new Cal(3000, 0, 1).addMonths(24).format("YYYY-MM-DD")).toBe("3002-01-01");
  });

  it("addMonths throws when the result leaves the calendar", () => {
    expect(() => new Cal(3000, 0, 1).addMonths(-1)).toThrowError("Resulting date is out of supported range");
    expect(() => new Cal(3002, 11, 1).addMonths(1)).toThrowError("Resulting date is out of supported range");
  });

  it("addYears clamps and returns a subclass instance", () => {
    const up = new Cal(3000, 1, 31).addYears(1);
    expect(up).toBeInstanceOf(Cal);
    expect(up.format("YYYY-MM-DD")).toBe("3001-02-30");
    expect(new Cal(3000, 1, 31).addYears(2).format("YYYY-MM-DD")).toBe("3002-02-31");
    expect(new Cal(3002, 1, 31).addYears(-2).format("YYYY-MM-DD")).toBe("3000-02-31");
    expect(() => new Cal(3000, 0, 1).addYears(3)).toThrowError("Resulting date is out of supported range");
    expect(() => new Cal(3000, 0, 1).addYears(-1)).toThrowError("Resulting date is out of supported range");
  });

  it("clone keeps the subclass and the date", () => {
    const original = new Cal(3001, 4, 9);
    const copy = original.clone();
    expect(copy).toBeInstanceOf(Cal);
    expect(copy).not.toBe(original);
    expect(copy.format("YYYY-MM-DD")).toBe("3001-05-09");
    expect(copy.getTime()).toBe(original.getTime());
  });

  it("startOf* / endOf* keep the subclass", () => {
    const d = new Cal(3001, 4, 9);
    expect(d.startOfMonth()).toBeInstanceOf(Cal);
    expect(d.startOfMonth().format("YYYY-MM-DD")).toBe("3001-05-01");
    expect(d.endOfMonth().format("YYYY-MM-DD")).toBe("3001-05-30");
    expect(d.startOfYear().format("YYYY-MM-DD")).toBe("3001-01-01");
    expect(d.endOfYear().format("YYYY-MM-DD")).toBe("3001-12-30");
    expect(new Cal(3002, 0, 1).endOfYear().format("YYYY-MM-DD")).toBe("3002-12-31");
    expect(d.endOfYear()).toBeInstanceOf(Cal);
  });

  it("startOfWeek / endOfWeek use the custom weekday", () => {
    const tuesday = new Cal(3001, 0, 1);
    expect(tuesday.startOfWeek().format("YYYY-MM-DD")).toBe("3000-12-30");
    expect(tuesday.endOfWeek().format("YYYY-MM-DD")).toBe("3001-01-05");
    expect(tuesday.startOfWeek(1).format("YYYY-MM-DD")).toBe("3000-12-31");
    expect(tuesday.startOfWeek()).toBeInstanceOf(Cal);
  });

  it("startOfDay / endOfDay stay on the same custom day", () => {
    const d = new Cal(3001, 4, 9);
    const start = d.startOfDay();
    const end = d.endOfDay();
    expect(start.format("YYYY-MM-DD")).toBe("3001-05-09");
    expect(end.format("YYYY-MM-DD")).toBe("3001-05-09");
    expect(end.getTime() - start.getTime()).toBe(DAY_MS - 1);
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it("diff / isSame / isBefore / isAfter / isEqual", () => {
    const a = new Cal(3000, 0, 1);
    const b = new Cal(3001, 2, 1);
    expect(b.diff(a, "year")).toBe(1);
    expect(b.diff(a, "month")).toBe(14);
    expect(b.diff(a, "day")).toBe(366 + 60);
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isEqual(a.clone())).toBe(true);
    expect(a.isSame(new Cal(3000, 5, 5), "year")).toBe(true);
    expect(a.isSame(new Cal(3000, 5, 5), "month")).toBe(false);
  });

  it("toString and getEnglishDate", () => {
    const d = new Cal(3000, 0, 6);
    expect(d.toString()).toBe("3000/1/6");
    expect(d.getEnglishDate().toISOString().slice(0, 10)).toBe(adOf(5));
  });
});

describe("Formatting with custom labels and digits", () => {
  const d = new Cal(3000, 1, 5); // Saturday, month index 1

  it("English month and weekday names", () => {
    expect(d.format("MMMM")).toBe("Month2");
    expect(d.format("MMM")).toBe("M2");
    expect(d.format("DDDD")).toBe("Day6");
    expect(d.format("DDD")).toBe("D6");
  });

  it("Nepali month and weekday names", () => {
    expect(d.format("mmmm")).toBe("NpMonth2");
    expect(d.format("mmm")).toBe("NM2");
    expect(d.format("dddd")).toBe("NpDay6");
    expect(d.format("ddd")).toBe("ND6");
  });

  it("Nepali digits come from the custom digit table", () => {
    // 3000 -> d a a a, month 2 -> c, day 5 -> f
    expect(d.format("yyyy")).toBe("daaa");
    expect(d.format("yy")).toBe("aa");
    expect(d.format("yyy")).toBe("aaa");
    expect(d.format("m")).toBe("c");
    expect(d.format("mm")).toBe("ac");
    expect(d.format("d")).toBe("f");
    expect(d.format("dd")).toBe("af");
    expect(d.format("yyyy-mm-dd")).toBe("daaa-ac-af");
  });

  it("English digits are unaffected by the Nepali digit table", () => {
    expect(d.format("YYYY-MM-DD")).toBe("3000-02-05");
    expect(d.format("YY")).toBe("00");
    expect(d.format("M-D")).toBe("2-5");
  });

  it("mixes literals, quotes and tokens", () => {
    expect(d.format('DDDD, "Month" MMMM D, YYYY')).toBe("Day6, Month Month2 5, 3000");
  });

  it("the default class keeps its own labels", () => {
    expect(new NepaliDate(2080, 0, 1).format("MMMM DDDD")).toBe("Baisakh Friday");
    expect(new NepaliDate(2080, 0, 1).format("mmmm dd")).toBe("बैशाख ०१");
  });

  it("a partial override only changes what it names", () => {
    const partial = defineConstants({ monthEn: range(12, (i) => `Only${String(i)}`) });
    class P extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return partial;
      }
    }
    const p = new P(2080, 0, 1);
    expect(p.format("MMMM")).toBe("Only0");
    expect(p.format("DDDD")).toBe("Friday");
    expect(p.format("mmmm")).toBe("बैशाख");
  });
});

describe("Extending the real calendar with extra years", () => {
  const extra = { year: 2101, days: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] };
  const extended = defineConstants({ dateMap: [...BUNDLED_CONSTANTS.dateMap, extra] });

  class Extended extends NepaliDate {
    protected static override constants(): NepaliConstants {
      return extended;
    }
  }

  it("supports the new year while the default class still rejects it", () => {
    expect(new Extended(2101, 0, 1).format("YYYY-MM-DD")).toBe("2101-01-01");
    expect(() => new NepaliDate(2101, 0, 1)).toThrowError("Nepal year out of range!");
    expect(Extended.isValid(2101, 11, 31)).toBe(true);
    expect(NepaliDate.isValid(2101, 11, 31)).toBe(false);
  });

  it("agrees with the default class on every shared date", () => {
    for (const [y, m, d] of [
      [1976, 0, 1],
      [2000, 5, 15],
      [2080, 0, 1],
      [2081, 6, 30],
      [2100, 11, 31],
    ]) {
      const base = new NepaliDate(y, m, d);
      const ext = new Extended(y, m, d);
      expect(ext.getTime()).toBe(base.getTime());
      expect(ext.format("YYYY-MM-DD dddd")).toBe(base.format("YYYY-MM-DD dddd"));
    }
  });

  it("lifts the maximum by exactly the added year", () => {
    const addedDays = extra.days.reduce((a, b) => a + b, 0);
    expect(Extended.maximum().getTime() - NepaliDate.maximum().getTime()).toBe(addedDays * DAY_MS);
    expect(Extended.minimum().getTime()).toBe(NepaliDate.minimum().getTime());
  });

  it("converts the day after the old maximum", () => {
    const after = new Date(NepaliDate.maximum().getTime() + DAY_MS);
    expect(() => new NepaliDate(after)).toThrowError("Date is out of supported range");
    expect(new Extended(after).format("YYYY-MM-DD")).toBe("2101-01-01");
  });

  it("addYears / endOfYear work across the old boundary", () => {
    expect(new Extended(2100, 5, 10).addYears(1).format("YYYY-MM-DD")).toBe("2101-06-10");
    expect(new Extended(2101, 0, 1).endOfYear().format("YYYY-MM-DD")).toBe("2101-12-31");
  });

  it("a corrected month length changes conversions only for the subclass", () => {
    const patched = BUNDLED_CONSTANTS.dateMap.map((e) =>
      e.year === 2080 ? { year: e.year, days: [32, ...e.days.slice(1)] } : { year: e.year, days: [...e.days] }
    );
    const fixed = defineConstants({ dateMap: patched });
    class Fixed extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return fixed;
      }
    }
    // bundled Baisakh 2080 has 31 days; the patched one has 32
    expect(new NepaliDate(2080, 0, 1).daysInMonth()).toBe(31);
    expect(new Fixed(2080, 0, 1).daysInMonth()).toBe(32);
    expect(Fixed.isValid(2080, 0, 32)).toBe(true);
    expect(NepaliDate.isValid(2080, 0, 32)).toBe(false);
    // one day later in Baisakh shifts every following date by one day
    expect(new Fixed(2080, 1, 1).getTime()).toBe(new NepaliDate(2080, 1, 1).getTime() + DAY_MS);
  });
});

describe("Custom epoch and UTC offset", () => {
  const epoch = Date.UTC(2000, 0, 1);
  const noOffset = defineConstants({
    epoch,
    utcOffsetMs: 0,
    dateMap: [
      { year: 1, days: Array<number>(12).fill(30) },
      { year: 2, days: Array<number>(12).fill(30) },
    ],
  });
  class Utc extends NepaliDate {
    protected static override constants(): NepaliConstants {
      return noOffset;
    }
  }

  const plus5 = defineConstants({
    epoch,
    utcOffsetMs: 5 * 3600000,
    dateMap: [{ year: 1, days: Array<number>(12).fill(30) }],
  });
  class Plus5 extends NepaliDate {
    protected static override constants(): NepaliConstants {
      return plus5;
    }
  }

  it("maps the custom epoch to the first day", () => {
    expect(new Utc(new Date(epoch)).format("YYYY-MM-DD")).toBe("1-01-01");
    expect(new Utc(1, 0, 1).getTime()).toBe(epoch);
    expect(new Utc(1, 1, 1).getTime()).toBe(epoch + 30 * DAY_MS);
    expect(new Utc(2, 11, 30).getTime()).toBe(epoch + 719 * DAY_MS);
  });

  it("time-of-day getters use the custom offset", () => {
    const instant = new Date(Date.UTC(2000, 0, 31, 13, 30, 15, 250));
    const u = new Utc(instant);
    expect([u.year, u.month, u.day]).toEqual([1, 1, 1]);
    expect(u.getHours()).toBe(13);
    expect(u.getMinutes()).toBe(30);
    expect(u.getSeconds()).toBe(15);
    expect(u.getMilliseconds()).toBe(250);

    const p = new Plus5(instant);
    expect(p.getHours()).toBe(18);
    expect(p.getMinutes()).toBe(30);
  });

  it("the offset can push an instant onto the next local day", () => {
    const late = new Date(Date.UTC(2000, 0, 1, 20, 0));
    expect(new Utc(late).day).toBe(1);
    expect(new Plus5(late).day).toBe(2);
  });

  it("startOfDay / endOfDay respect the offset", () => {
    const instant = new Date(Date.UTC(2000, 0, 1, 20, 0));
    const p = new Plus5(instant);
    expect(p.startOfDay().getHours()).toBe(0);
    expect(p.endOfDay().getHours()).toBe(23);
    expect(p.startOfDay().day).toBe(2);
  });

  it("rejects instants outside the custom range", () => {
    expect(() => new Utc(new Date(epoch - 1))).toThrowError("Date is out of supported range");
    expect(() => new Utc(new Date(epoch + 720 * DAY_MS))).toThrowError("Date is out of supported range");
  });

  it("supports a negative offset", () => {
    const west = defineConstants({
      epoch,
      utcOffsetMs: -3 * 3600000,
      dateMap: [{ year: 1, days: Array<number>(12).fill(30) }],
    });
    class West extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return west;
      }
    }
    // 01:00 UTC on Jan 2 is still Jan 1 at UTC-3, which is the epoch day
    const w = new West(new Date(Date.UTC(2000, 0, 2, 1, 0)));
    expect(w.day).toBe(1);
    expect(w.getHours()).toBe(22);
  });
});

describe("Copy constructor across calendars", () => {
  it("copies fields directly when both sides share a calendar and detaches the Date", () => {
    const original = new Cal(3001, 4, 9);
    const copy = new Cal(original);
    expect([copy.year, copy.month, copy.day]).toEqual([3001, 4, 9]);
    expect(copy.timestamp).not.toBe(original.timestamp);
    expect(copy.getTime()).toBe(original.getTime());
  });

  it("mutating a copy's Date does not leak into the original", () => {
    const original = new Cal(3001, 4, 9);
    const copy = new Cal(original);
    copy.timestamp.setTime(0);
    expect(original.getTime()).not.toBe(0);
  });

  it("copies between the default class and a subclass that shares its calendar", () => {
    class SameCalendar extends NepaliDate {}
    const copy = new SameCalendar(new NepaliDate(2080, 5, 6));
    expect(copy.format("YYYY-MM-DD")).toBe("2080-06-06");
    expect(new NepaliDate(copy).format("YYYY-MM-DD")).toBe("2080-06-06");
  });

  it("recomputes fields from the instant when the calendars differ", () => {
    const shifted = defineConstants({
      epoch: Date.UTC(2023, 3, 14),
      dateMap: [{ year: 2080, days: [30, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] }],
    });
    class Shifted extends NepaliDate {
      protected static override constants(): NepaliConstants {
        return shifted;
      }
    }
    // bundled Baisakh 2080 has 31 days, so day 31 there is day 1 of month 2 in the shifted calendar
    const converted = new Shifted(new NepaliDate(2080, 0, 31));
    expect([converted.year, converted.month, converted.day]).toEqual([2080, 1, 1]);
    expect(converted.isValid()).toBe(true);
    expect(converted.getTime()).toBe(new NepaliDate(2080, 0, 31).getTime());
  });

  it("throws instead of keeping foreign fields that make no sense in the new calendar", () => {
    expect(() => new Cal(new NepaliDate(2080, 0, 1))).toThrowError("Date is out of supported range");
    // both calendars share the default epoch, so the same instant is 1976-01-01 in the bundled one
    expect(new NepaliDate(new Cal(3000, 0, 1)).format("YYYY-MM-DD")).toBe("1976-01-01");
  });
});

describe("ADtoBS / BStoAD with a custom class", () => {
  it("convert using the subclass calendar", () => {
    expect(ADtoBS("1919-04-13", Cal)).toBe("3000-01-01");
    expect(BStoAD("3000-01-01", Cal)).toBe("1919-04-13");
    expect(BStoAD("3001-01-01", Cal)).toBe(adOf(366));
    expect(BStoAD("3002-12-31", Cal)).toBe(adOf(1097));
    expect(ADtoBS(adOf(726), Cal)).toBe("3002-01-01");
  });

  it("round-trip every custom day", () => {
    for (let n = 0; n < 1098; n += 17) {
      const bs = ADtoBS(adOf(n), Cal);
      expect(BStoAD(bs, Cal)).toBe(adOf(n));
    }
  });

  it("report conversion failures outside the custom range", () => {
    expect(() => ADtoBS("2023-04-14", Cal)).toThrowError("Failed to convert AD to BS");
    expect(() => BStoAD("2080-01-01", Cal)).toThrowError("Failed to convert BS to AD");
    expect(() => BStoAD("3001-01-31", Cal)).toThrowError("Failed to convert BS to AD");
  });

  it("keep validating the input shape", () => {
    expect(() => ADtoBS("1919/04/13", Cal)).toThrowError("Invalid date format");
    expect(() => BStoAD("3000-1-1", Cal)).toThrowError("Invalid date format");
  });

  it("default behaviour is unchanged when no class is passed", () => {
    expect(ADtoBS("2023-04-14")).toBe("2080-01-01");
    expect(BStoAD("2080-01-01")).toBe("2023-04-14");
    expect(() => ADtoBS("1919-04-13")).not.toThrow();
    expect(() => BStoAD("3000-01-01")).toThrowError("Failed to convert BS to AD");
  });
});
