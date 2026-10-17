# Contributing to NepaliDate (NodeJS & TypeScript) 🇳🇵

First off, thank you for considering contributing to the **NepaliDate Library**! It's people like you that make this open-source ecosystem better for everyone.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **pnpm**: Version 10 recommended (`corepack enable pnpm`)

### Setup

```bash
git clone https://github.com/SandipGhimire/Nepali-Date-Library-NodeJS.git
cd Nepali-Date-Library-NodeJS
pnpm install
```

### Building

```bash
pnpm run build
```

### Testing

We use **Vitest** for testing across both Node and browser (JSDOM) environments:

```bash
# Run tests for both node and browser
pnpm run test

# Run compatibility test across legacy Node runtimes (8-17)
pnpm run test:compat
```

### Linting & Formatting

```bash
pnpm run lint
pnpm run format
```

---

## 📚 Documentation

Official API references, guides, and live tools:

- **Documentation**: [https://nepali-pkg.date/docs/nodejs](https://nepali-pkg.date/docs/nodejs)
- **Live Converter**: [https://nepali-pkg.date/converter](https://nepali-pkg.date/converter)

---

## 🚀 How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. When creating a bug report, please include:

- A clear, descriptive title and summary.
- Minimal reproduction steps with code snippets.
- Expected vs. actual output.
- Environment details (Node.js version, library version, OS).

### Suggesting Enhancements

Feature requests are also tracked as GitHub issues. Please provide:

- A clear description of the problem your feature solves.
- A detailed description of the proposed solution or API design.
- Any alternative solutions or edge cases considered.

### Pull Requests

1. Fork the repository and create your branch from `master` (`git checkout -b feat/your-feature-name`).
2. Add comprehensive tests for any added features or bug fixes.
3. Ensure all tests pass (`pnpm run test` and `pnpm run test:compat`).
4. Ensure linting and formatting pass cleanly (`pnpm run lint`).
5. Submit your Pull Request on GitHub with a clear description of your changes.

---

## 📄 License

Contributions are licensed under the [MIT License](./LICENSE).  
Made with ❤️ by [Sandip Ghimire](https://github.com/SandipGhimire).
