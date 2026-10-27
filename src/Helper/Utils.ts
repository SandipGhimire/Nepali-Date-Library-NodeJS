import type { NepaliConstants, NepaliDateMapEntry, ProcessedDateMapEntry, ProcessedNepaliConstants } from "../types";

export function processDateMap(dateMap: NepaliDateMapEntry[]): ProcessedDateMapEntry[] {
  const len = dateMap.length;
  const result: ProcessedDateMapEntry[] = new Array<ProcessedDateMapEntry>(len);
  let totalDaysAccumulator = 0;

  for (let i = 0; i < len; i += 1) {
    const entry = dateMap[i];
    const d = entry.days;
    const totalDays =
      d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8] + d[9] + d[10] + d[11];
    totalDaysAccumulator += totalDays;

    result[i] = {
      year: entry.year,
      days: d,
      totalDays,
      daysTillNow: totalDaysAccumulator,
    };
  }

  return result;
}

export function processConstants(constants: NepaliConstants): ProcessedNepaliConstants {
  return {
    ...constants,
    dateMap: processDateMap(constants.dateMap),
  };
}

