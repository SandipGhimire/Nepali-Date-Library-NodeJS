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
git clone https://github.com/SandipGhimire/nepali-date-library.git
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

### Linting & Formatting

```bash
pnpm run lint
pnpm run format
```

## Code of Conduct

Please be respectful and professional in all your interactions with the project and other contributors.
