import { BUNDLED_CONSTANTS } from "./Constants";
import type { NepaliConstants, NepaliDateMapEntry, ProcessedDateMapEntry, ProcessedNepaliConstants } from "../types";

const MS_PER_DAY = 86400000;
const MAX_DAYS_IN_MONTH = 32;

const CONSTANT_KEYS: readonly (keyof NepaliConstants)[] = [
  "dateMap",
  "epoch",
  "utcOffsetMs",
  "weekEn",
  "weekShortEn",
  "weekNp",
  "weekShortNp",
  "monthEn",
  "monthShortEn",
  "monthNp",
  "monthShortNp",
  "numberNp",
];

/** Required length of every name table. */
const NAME_TABLE_SIZES: readonly (readonly [keyof NepaliConstants, number])[] = [
  ["weekEn", 7],
  ["weekShortEn", 7],
  ["weekNp", 7],
  ["weekShortNp", 7],
  ["monthEn", 12],
  ["monthShortEn", 12],
  ["monthNp", 12],
  ["monthShortNp", 12],
  ["numberNp", 10],
];

function fail(message: string): never {
  throw new Error(`Invalid Nepali constants: ${message}`);
}

/**
 * Validates a (raw) constants object and throws a descriptive error on the first problem found.
 *
 * Checks that:
 * - `dateMap` is a non-empty list of consecutive years, each with 12 integer month lengths (1-32)
 * - `epoch` is an integer number of milliseconds falling exactly on a UTC midnight
 * - `utcOffsetMs` is a finite number
 * - every name table (weeks, months, digits) has the right size and only holds strings
 *
 * @param constants Constants to validate
 * @throws Error when the constants are not usable
 */
export function validateConstants(constants: NepaliConstants): void {
  if (typeof constants !== "object" || Array.isArray(constants) || (constants as unknown) === null) {
    fail("constants must be an object");
  }

  const { dateMap, epoch, utcOffsetMs } = constants;

  if (!Array.isArray(dateMap) || dateMap.length === 0) {
    fail("dateMap must be a non-empty array");
  }

  for (const [i, raw] of dateMap.entries()) {
    const entry = raw as NepaliDateMapEntry | undefined;
    if (typeof entry !== "object" || !Number.isInteger(entry.year)) {
      fail(`dateMap[${String(i)}].year must be an integer`);
    }
    if (entry.year !== dateMap[0].year + i) {
      fail(
        `dateMap years must be consecutive, expected ${String(dateMap[0].year + i)} at index ${String(i)} but got ${String(entry.year)}`
      );
    }
    if (!Array.isArray(entry.days) || entry.days.length !== 12) {
      fail(`dateMap[${String(i)}] (year ${String(entry.year)}) must have exactly 12 month lengths`);
    }
    for (let m = 0; m < 12; m += 1) {
      const days = entry.days[m];
      if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS_IN_MONTH) {
        fail(
          `month ${String(m + 1)} of year ${String(entry.year)} must be an integer between 1 and ${String(MAX_DAYS_IN_MONTH)}`
        );
      }
    }
  }

  if (!Number.isInteger(epoch) || epoch % MS_PER_DAY !== 0) {
    fail("epoch must be an integer number of milliseconds on a UTC midnight boundary");
  }

  if (typeof utcOffsetMs !== "number" || !Number.isFinite(utcOffsetMs)) {
    fail("utcOffsetMs must be a finite number");
  }

  for (const [key, size] of NAME_TABLE_SIZES) {
    const table = constants[key] as unknown;
    if (!Array.isArray(table) || table.length !== size) {
      fail(`${key} must be an array of exactly ${String(size)} strings`);
    }
    for (const item of table as unknown[]) {
      if (typeof item !== "string") {
        fail(`${key} must only contain strings`);
      }
    }
  }
}

/**
 * Builds the processed (cumulative) calendar table from a raw one.
 * The result is a snapshot: it never shares arrays with the input.
 * @param dateMap Raw year entries
 * @returns Frozen year entries with `totalDays` and `daysTillNow` computed
 */
export function processDateMap(dateMap: NepaliDateMapEntry[]): ProcessedDateMapEntry[] {
  const result: ProcessedDateMapEntry[] = [];
  let accumulator = 0;

  for (const entry of dateMap) {
    const days = entry.days.slice();
    let totalDays = 0;
    for (const monthDays of days) {
      totalDays += monthDays;
    }
    accumulator += totalDays;

    result.push(
      Object.freeze({
        year: entry.year,
        days: Object.freeze(days) as number[],
        totalDays,
        daysTillNow: accumulator,
      })
    );
  }

  return Object.freeze(result) as ProcessedDateMapEntry[];
}

/**
 * Validates raw constants and turns them into a frozen, ready-to-use snapshot.
 * Later changes to the raw object do not affect the snapshot.
 * @param constants Raw constants
 * @returns Frozen processed constants
 * @throws Error when the constants fail validation
 */
export function processConstants(constants: NepaliConstants): ProcessedNepaliConstants {
  validateConstants(constants);

  const freezeList = (list: string[]): string[] => Object.freeze(list.slice()) as string[];

  return Object.freeze({
    dateMap: processDateMap(constants.dateMap),
    epoch: constants.epoch,
    utcOffsetMs: constants.utcOffsetMs,
    weekEn: freezeList(constants.weekEn),
    weekShortEn: freezeList(constants.weekShortEn),
    weekNp: freezeList(constants.weekNp),
    weekShortNp: freezeList(constants.weekShortNp),
    monthEn: freezeList(constants.monthEn),
    monthShortEn: freezeList(constants.monthShortEn),
    monthNp: freezeList(constants.monthNp),
    monthShortNp: freezeList(constants.monthShortNp),
    numberNp: freezeList(constants.numberNp),
  });
}

/**
 * Finds the index of the year block that contains the given zero-based day offset
 * (days since the epoch). Uses binary search, so it works for any year length.
 * @param dateMap Processed year entries
 * @param daysCount Days since the epoch, must be inside the calendar range
 * @returns Index into `dateMap`
 */
export function findYearIndex(dateMap: readonly ProcessedDateMapEntry[], daysCount: number): number {
  let lo = 0;
  let hi = dateMap.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (daysCount < dateMap[mid].daysTillNow) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}

/**
 * Builds a validated constants object by layering `overrides` over the bundled data.
 * Fields that are not overridden fall back to the bundled values, so a partial object is fine.
 *
 * @example
 * const constants = defineConstants({
 *   dateMap: [...BUNDLED_CONSTANTS.dateMap, { year: 2101, days: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] }],
 * });
 *
 * @param overrides Any subset of the constants
 * @returns A complete, validated constants object (a copy, safe to keep)
 * @throws Error on unknown keys or invalid values
 */
export function defineConstants(overrides: Partial<NepaliConstants> = {}): NepaliConstants {
  for (const key of Object.keys(overrides)) {
    if (CONSTANT_KEYS.indexOf(key as keyof NepaliConstants) === -1) {
      fail(`unknown key "${key}"`);
    }
  }

  const merged: NepaliConstants = { ...BUNDLED_CONSTANTS };
  for (const key of CONSTANT_KEYS) {
    const value = overrides[key];
    if (value !== undefined) {
      (merged as unknown as Record<string, unknown>)[key] = value;
    }
  }

  validateConstants(merged);

  return {
    dateMap: merged.dateMap.map((entry) => ({ year: entry.year, days: entry.days.slice() })),
    epoch: merged.epoch,
    utcOffsetMs: merged.utcOffsetMs,
    weekEn: merged.weekEn.slice(),
    weekShortEn: merged.weekShortEn.slice(),
    weekNp: merged.weekNp.slice(),
    weekShortNp: merged.weekShortNp.slice(),
    monthEn: merged.monthEn.slice(),
    monthShortEn: merged.monthShortEn.slice(),
    monthNp: merged.monthNp.slice(),
    monthShortNp: merged.monthShortNp.slice(),
    numberNp: merged.numberNp.slice(),
  };
}
