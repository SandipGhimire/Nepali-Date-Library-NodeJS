export interface NepaliDateMapEntry {
  year: number;
  days: number[];
}

export interface ProcessedDateMapEntry extends NepaliDateMapEntry {
  totalDays: number;
  daysTillNow: number;
}

export interface NepaliConstants {
  dateMap: NepaliDateMapEntry[];
  epoch: number;
  utcOffsetMs: number;
  weekEn: string[];
  weekShortEn: string[];
  weekNp: string[];
  weekShortNp: string[];
  monthEn: string[];
  monthShortEn: string[];
  monthNp: string[];
  monthShortNp: string[];
  numberNp: string[];
}

export interface ProcessedNepaliConstants extends NepaliConstants {
  dateMap: ProcessedDateMapEntry[];
}
