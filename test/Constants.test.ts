import { describe, it, expect } from "vitest";
import {
  NEPALI_DATE_MAP,
  NUMBER_NP,
  WEEK_EN,
  WEEK_NP,
  WEEK_SHORT_EN,
  WEEK_SHORT_NP,
  MONTH_EN,
  MONTH_NP,
  MONTH_SHORT_EN,
  MONTH_SHORT_NP,
} from "../src/index";

describe("Constants", () => {
  it("week arrays have 7 entries starting with Sunday", () => {
    for (const arr of [WEEK_EN, WEEK_NP, WEEK_SHORT_EN, WEEK_SHORT_NP]) {
      expect(arr).toHaveLength(7);
    }
    expect(WEEK_EN[0]).toBe("Sunday");
    expect(WEEK_SHORT_EN[0]).toBe("Sun");
  });

  it("month arrays have 12 entries starting with Baisakh", () => {
    for (const arr of [MONTH_EN, MONTH_NP, MONTH_SHORT_EN, MONTH_SHORT_NP]) {
      expect(arr).toHaveLength(12);
    }
    expect(MONTH_EN[0]).toBe("Baisakh");
    expect(MONTH_SHORT_EN[0]).toBe("Bai");
  });

  it("NUMBER_NP maps digits 0-9 to Devanagari numerals", () => {
    expect(NUMBER_NP).toHaveLength(10);
    expect(NUMBER_NP[0]).toBe("०");
    expect(NUMBER_NP[9]).toBe("९");
  });

  it("NEPALI_DATE_MAP starts at 1976 and each year has 12 months", () => {
    expect(NEPALI_DATE_MAP[0].year).toBe(1976);
    for (const yearData of NEPALI_DATE_MAP) {
      expect(yearData.days).toHaveLength(12);
    }
  });
});
