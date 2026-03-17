import { NepaliDate, ADtoBS, BStoAD, NEPALI_DATE_MAP } from "../src/index";

describe("Master Test Case: Full Range Verification (1976 - 2100)", () => {
  it("should maintain consistency for every day in the supported range", () => {
    for (const yearData of NEPALI_DATE_MAP) {
      for (const [monthIndex, daysInMonth] of yearData.days.entries()) {
        for (let i = 1; i <= daysInMonth; i++) {
          const nepaliDate = new NepaliDate(yearData.year, monthIndex, i);
          const bsToAdDate = BStoAD(nepaliDate.format("YYYY-MM-DD"));
          const nepaliDate2 = new NepaliDate(new Date(bsToAdDate));
          const adToBsDate = ADtoBS(bsToAdDate);

          if(nepaliDate.format("YYYY-MM-DD") !== nepaliDate2.format("YYYY-MM-DD")) {
            console.log("----Failed Date----\nInital Date:", nepaliDate.format("YYYY-MM-DD"), "\nConverted Date:", bsToAdDate, "\nReconverted Date:", nepaliDate2.format("YYYY-MM-DD"))
          }

          expect(nepaliDate.format("YYYY-MM-DD")).toBe(nepaliDate2.format("YYYY-MM-DD"));
          expect(nepaliDate.format("YYYY-MM-DD")).toBe(adToBsDate);
        }
      }
    }
  });
});
