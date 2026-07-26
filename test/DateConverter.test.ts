import { describe, it, expect } from "vitest";
import { ADtoBS, BStoAD } from "../src/index";

describe("DateConverter", () => {
  it("ADtoBS converts a known date", () => {
    expect(ADtoBS("2023-04-14")).toBe("2080-01-01");
  });

  it("BStoAD converts a known date", () => {
    expect(BStoAD("2080-01-01")).toBe("2023-04-14");
  });

  it("round-trips AD -> BS -> AD", () => {
    const ad = "2023-04-28";
    const bs = ADtoBS(ad);
    expect(BStoAD(bs)).toBe(ad);
  });

  it("ADtoBS rejects malformed input", () => {
    expect(() => ADtoBS("2023/04/14")).toThrow("Invalid date format. Expected format: YYYY-MM-DD");
  });

  it("BStoAD rejects malformed input", () => {
    expect(() => BStoAD("2080/01/01")).toThrow("Invalid date format. Expected format: YYYY-MM-DD");
  });

  it("ADtoBS rejects an out-of-range date", () => {
    expect(() => ADtoBS("1800-01-01")).toThrow("Failed to convert AD to BS");
  });

  it("BStoAD rejects an out-of-range year", () => {
    expect(() => BStoAD("1800-01-01")).toThrow("Failed to convert BS to AD");
  });
});
