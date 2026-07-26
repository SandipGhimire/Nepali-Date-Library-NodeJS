# Contributing to NepaliDate

First off, thank you for considering contributing to NepaliDate! It's people like you that make this library better for everyone.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. When creating a bug report, please include:

- A clear and concise description of the bug.
- Steps to reproduce the behavior.
- Expected vs. actual behavior.
- Environment details (OS, Node version, NepaliDate version).

### Suggesting Enhancements

Feature requests are also tracked as GitHub issues. Please provide:

- A clear description of the problem your feature solves.
- A detailed description of the proposed solution.
- Any alternative solutions you've considered.

### Pull Requests

1. Fork the repository and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`pnpm run test`).
4. Make sure your code lints (`pnpm run lint`).
5. Follow the formatting rules (`pnpm run format`).
6. Issue that Pull Request!

## Development Setup

### Prerequisites

- **Node.js**: >= 24.0.0
- **pnpm**: Version 10 recommended

### Setup

```bash
git clone https://github.com/SandipGhimire/Nepali-Date-Library-NodeJS.git
cd nepali-date-library
pnpm install
```

### Building

```bash
pnpm run build
```

### Testing

We use **Vitest** for testing in both Node and JSDOM environments.

```bash
pnpm run test
# Runs tests for both node and browser
```

`package.json` declares `"engines": { "node": ">=8" }`, but Vitest itself
needs a modern Node runtime. Compatibility with older Node versions is
verified separately, against the built `dist/index.cjs` bundle, using a
framework-free script that only needs Node's built-in `assert` module:

```bash
pnpm run build
pnpm run test:compat
```

CI runs `pnpm run test` on Node 18-26 and `test:compat` on Node 8-17, so the
full advertised range (8-26) is covered on every push.

### Linting & Formatting

```bash
pnpm run lint
pnpm run format
```

## Code of Conduct

Please be respectful and professional in all your interactions with the project and other contributors.
