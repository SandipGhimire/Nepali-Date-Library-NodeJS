# NepaliDate Library (NodeJS & TypeScript) 🇳🇵

[![npm version](https://img.shields.io/npm/v/nepali-date-library.svg?style=flat-square&color=E1804B)](https://www.npmjs.com/package/nepali-date-library)
[![npm downloads](https://img.shields.io/npm/dm/nepali-date-library.svg?style=flat-square&color=27845A)](https://www.npmjs.com/package/nepali-date-library)
[![Documentation](https://img.shields.io/badge/Docs-nepali--pkg.date-E1804B?style=flat-square&logo=google-chrome&logoColor=white)](https://nepali-pkg.date/docs/nodejs)
[![Date Converter](https://img.shields.io/badge/Converter-BS%20%E2%86%94%20AD-24292E?style=flat-square)](https://nepali-pkg.date/converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

A lightweight, zero-dependency, high-performance library and **Nepali Date Converter** for working with **Bikram Sambat (BS)** dates in modern TypeScript and JavaScript.

---

### 📖 Full Documentation & Live Tools

All guides, complete API references, Devanagari format tokens, fiscal year helpers, and interactive playground are hosted on our official documentation portal:

👉 **[https://nepali-pkg.date/docs/nodejs](https://nepali-pkg.date/docs/nodejs)**  
🔄 **[Try the Live Date Converter](https://nepali-pkg.date/converter)**

---

## 📦 Installation

```bash
npm install nepali-date-library
```

> **Beta:** the pluggable-calendar-data release is available on the `beta` tag.
>
> ```bash
> npm install nepali-date-library@beta
> ```

---

## 🚀 Quick Example

```ts
import { NepaliDate } from "nepali-date-library";

const today = new NepaliDate();
console.log(today.format("YYYY-MM-DD")); // "2081-07-01"
```

> **Note**: For complete API methods, bidirectional conversion (`ADtoBS` / `BStoAD`), date arithmetic, and fiscal year guides, visit [**https://nepali-pkg.date/docs/nodejs**](https://nepali-pkg.date/docs/nodejs).

---

## 🛠️ Custom Calendar Data

The calendar tables are replaceable, so you can add new years, fix a month length or change labels without waiting for a release. Subclass `NepaliDate`, override the static `constants()` hook and return an object built with `defineConstants()`:

```ts
import { NepaliDate, BUNDLED_CONSTANTS, defineConstants, ADtoBS } from "nepali-date-library";

const MY_CALENDAR = defineConstants({
  // anything you leave out falls back to the bundled data
  dateMap: [...BUNDLED_CONSTANTS.dateMap, { year: 2101, days: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31] }],
});

class MyNepaliDate extends NepaliDate {
  protected static override constants() {
    return MY_CALENDAR; // return the same object every time
  }
}

new MyNepaliDate(2101, 0, 1).format("YYYY-MM-DD"); // "2101-01-01"
MyNepaliDate.isValid(2101, 0, 1); // true (static helpers follow the subclass too)
ADtoBS("2044-04-13", MyNepaliDate); // converters accept your class
```

Good to know:

- Settable fields: `dateMap`, `epoch`, `utcOffsetMs`, `weekEn`, `weekShortEn`, `weekNp`, `weekShortNp`, `monthEn`, `monthShortEn`, `monthNp`, `monthShortNp`, `numberNp`.
- Constants are validated once (consecutive years, 12 months of 1-32 days, name tables of the right size, ...) and snapshotted on first use. Later edits to your object are ignored; to change the calendar, return a different object.
- `BUNDLED_CONSTANTS` is frozen. Build your own with `defineConstants()` instead of editing it.
- Time-dependent helpers such as `getCurrentFiscalYear()` use today's date, so they throw if today is outside your calendar. Pass an explicit year in that case.

## 🤝 Contributing

Contributions are welcome! Please read our [**Contributing Guide**](./CONTRIBUTING.md) or visit our [**Online Contribution Guide**](https://nepali-pkg.date/docs/contribution).

---

## 📄 License

MIT © [Sandip Ghimire](https://github.com/SandipGhimire)  
Made with ❤️ by [Sandip Ghimire](https://github.com/SandipGhimire).
