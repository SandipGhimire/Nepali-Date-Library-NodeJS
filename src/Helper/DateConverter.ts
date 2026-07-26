import { NepaliDate } from "../NepaliDate";

// Custom Error class for Date Conversion
class DateConversionError extends Error {
  public readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "DateConversionError";
    this.cause = cause;

    Object.setPrototypeOf(this, DateConversionError.prototype);
  }
}

/**
 * Converts a Anno Domini (AD) date to an Bikram Sambat(BS) Date.
 * @param adDate The Anno Domini (AD) date in "YYYY-MM-DD" format.
 * @returns The corresponding Bikram Sambat(BS) date in "YYYY-MM-DD" format.
 */
export const ADtoBS = (adDate: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(adDate)) {
    throw new Error("Invalid date format. Expected format: YYYY-MM-DD");
  }

  // CRITICAL FIX: Parse date as UTC to avoid timezone shifts
  const [year, month, day] = adDate.split("-").map(Number);
  const ad = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(ad.getTime())) {
    throw new Error(`Invalid date input '${adDate}'`);
  }

  try {
    const nepaliDate = new NepaliDate(ad);
    return nepaliDate.format("YYYY-MM-DD");
  } catch (err) {
    throw new DateConversionError("Failed to convert AD to BS", err);
  }
};

/**
 * Converts a Bikram Sambat(BS) to an Anno Domini (AD) Date.
 * @param bsDate The Bikram Sambat(BS) date in "YYYY-MM-DD" format.
 * @returns The corresponding Anno Domini (AD) date in "YYYY-MM-DD" format.
 */
export function BStoAD(bsDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bsDate)) {
    throw new Error("Invalid date format. Expected format: YYYY-MM-DD");
  }
  try {
    const nepaliDateInstance = bsDate ? new NepaliDate(bsDate) : new NepaliDate();
    const pad = (n: number) => (n < 10 ? `0${String(n)}` : String(n));
    const date = nepaliDateInstance.getEnglishDate();

    return `${String(date.getUTCFullYear())}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  } catch (err) {
    throw new DateConversionError("Failed to convert BS to AD", err);
  }
}
