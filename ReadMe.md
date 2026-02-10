# NepaliDate Library

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/SandipGhimire/Nepali-Date-Library/blob/master/LICENSE)
[![Docs](https://img.shields.io/badge/Docs-Official%20Wiki-blue)](https://nepalidate.sandip-ghimire.com.np)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/SandipGhimire/nepali-date-library)

## Overview

**NepaliDate** is a lightweight, high-performance library for working with Nepali (Bikram Sambat) dates in modern TypeScript and JavaScript environments. It provides seamless conversion between BS and Gregorian (AD) dates, support for fiscal years, quarters, and comprehensive formatting options.

## Features

- 🚀 **Zero Dependency**: Pure TypeScript/JavaScript implementation with no external dependencies.
- ⚙️ **Dual Environment**: Fully compatible with both **Node.js** and **Browsers**.
- ⚡ **High Performance**: Optimized algorithms for date conversion and range verification.
- 🛡️ **Extensive Coverage**: Supports dates from **1976/01/01 BS** to **2100/12/31 BS**.
- ⏱️ **Flexible Formatting**: Robust formatting system (e.g., `YYYY-MM-DD`, `DD MMMM YYYY`).
- 🌿 **Fiscal Support**: Built-in logic for Nepali fiscal years and quarters.

## Installation

```sh
npm install nepali-date-library
# or
pnpm add nepali-date-library
```

## Quick Start

1. **Basic Usage** in your project:

   ```ts
   import { NepaliDate, ADtoBS, BStoAD } from "nepali-date-library";

   // Create a new Nepali Date (current time)
   const now = new NepaliDate();
   console.log(now.format("YYYY-MM-DD")); // e.g., 2081-11-28

   // Convert AD to BS
   const bsDate = ADtoBS("2024-03-14");
   console.log(bsDate); // 13-12-11 (example)
   ```

2. **Parsing & Formatting**:

   ```ts
   const date = new NepaliDate("2080-01-01");
   console.log(date.format("DD MMMM YYYY")); // 01 Baisakh 2080
   ```

3. **Automation**: Use NepaliDate in your automated tasks or backend services with full type safety.

## 📚 Documentation

For a deep dive into all available methods, conversion logic, and advanced configurations, visit our **[Official Wiki](https://nepalidate.sandip-ghimire.com.np)**.

## Contributing

Contributions are welcome! Whether it's optimization, feature suggestions, or bug reports, please see our **[CONTRIBUTING.md](CONTRIBUTING.md)** for details.

## License

[MIT](https://github.com/SandipGhimire/Nepali-Date-Library/blob/master/LICENSE) © [Sandip Ghimire](https://github.com/SandipGhimire)
