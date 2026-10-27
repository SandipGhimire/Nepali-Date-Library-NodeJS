import { describe, expect, it } from "vitest";
import { NepaliDate } from "../src/NepaliDate";
import { BUNDLED_CONSTANTS } from "../src/Helper/Constants";
import type { NepaliConstants } from "../src/types";

describe("Pluggable Constants Performance Benchmark", () => {
  it("benchmark bundled constants resolution speed", () => {
    const date = new NepaliDate();
    const N = 1000000;

    const start = performance.now();
    for (let i = 0; i < N; i++) {
      // @ts-expect-error calling private getConstants for benchmark
      date.getConstants();
    }
    const elapsedMs = performance.now() - start;
    const microPerOp = (elapsedMs * 1000) / N;

    console.log(
      `\n[NodeJS Benchmark] Default getConstants(): ${microPerOp.toFixed(4)} µs/op (${(
        (N / elapsedMs) *
        1000
      ).toLocaleString()} ops/sec)`
    );

    // Should be sub-microsecond
    expect(microPerOp).toBeLessThan(1.0);
  });

  it("benchmark custom constants resolution and change detection speed", () => {
    const customData: NepaliConstants = {
      ...BUNDLED_CONSTANTS,
      dateMap: [
        { year: 2080, days: [31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 29, 31] },
        { year: 2081, days: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
      ],
    };

    class CustomNepaliDate extends NepaliDate {
      protected _getConstants(): NepaliConstants {
        return customData;
      }
    }

    const customDate = new CustomNepaliDate();

    // First call (triggers processing)
    const t0 = performance.now();
    // @ts-expect-error calling private getConstants
    const firstResolved = customDate.getConstants();
    const firstRunMicro = (performance.now() - t0) * 1000;

    expect(firstResolved.dateMap[0].totalDays).toBe(365);
    expect(firstResolved.dateMap[0].daysTillNow).toBe(365);
    expect(firstResolved.dateMap[1].daysTillNow).toBe(365 + 366);

    // Subsequent calls (cached reference)
    const N = 1000000;
    const start = performance.now();
    for (let i = 0; i < N; i++) {
      // @ts-expect-error calling private getConstants
      customDate.getConstants();
    }
    const elapsedMs = performance.now() - start;
    const cachedMicro = (elapsedMs * 1000) / N;

    console.log(
      `[NodeJS Benchmark] Custom first-run process: ${firstRunMicro.toFixed(
        2
      )} µs | Cached calls: ${cachedMicro.toFixed(4)} µs/op`
    );

    expect(cachedMicro).toBeLessThan(1.0);
  });
});

