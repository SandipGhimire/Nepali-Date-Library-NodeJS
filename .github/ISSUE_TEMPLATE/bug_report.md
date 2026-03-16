**Title:** `[BUG] `

**Describe the bug**
A clear and concise description of the bug in the `nepali-date-library`. For example, wrong date conversion, unexpected output, or error thrown.

**To Reproduce**
Steps to reproduce the behavior:

```javascript
const { NepaliDate } = require("nepali-date-library");

const nd = new NepaliDate("2026-03-16");
const result = nd.format("YYYY-MM-DD");
console.log(result);
```

1. Run the above code (or your code that uses the library)
2. Observe the output/error

**Expected behavior**
What you expected to happen. For example:

```
Expected output: "2079-12-02"
```

**Actual behavior**
What actually happened. For example:

```
Actual output: "2079-11-31" // incorrect date
```

**Environment (please complete the following information):**

- Node Version: [e.g. 24.x]
- npm/yarn Version: [e.g. 9.7.2]
- Operating System: [e.g. Ubuntu 22.04, macOS 13]
- `nepali-date-library` Version: [e.g. 1.2.0]

**Logs / Stack Trace**
Paste any error messages or logs that appear.

**Additional context**
Add any other context about the problem here, e.g., edge cases, specific input dates, or system locale.
