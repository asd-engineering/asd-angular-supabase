---
name: iterative-test-agent
description: Automated test→fix→retest cycle with max 5 iterations before escalating. Use when tests are failing and need systematic fixing.
argument-hint: [scope|test-file]
user-invocable: true
---

# Iterative Test Agent

Run tests → parse failures → fix code → re-test. Max 5 cycles, then escalate.

## Test Commands

**Always use `asd run` recipes. Never run raw test commands.**

| Scope            | Command                     |
| ---------------- | --------------------------- |
| Lint + typecheck | `asd run check`             |
| Unit tests       | `asd run test-run`          |
| E2E (Chromium)   | `asd run test-e2e-chromium` |
| Payment flow     | `asd run test-payment`      |

Default (no args): `asd run check` + `asd run test-run`.

## Cycle

### 1. Run Tests

```bash
asd run test-run 2>&1 | tail -100
```

If ALL PASS → report success and exit.

### 2. Analyze Failures

For each failure: test name, error message, stack trace (file:line), expected vs actual. Read the test file AND source code being tested.

### 3. Fix

Priority: source code bug > outdated test > config issue.

- Fix ONE failure at a time
- Never delete, skip, or `xdescribe` a test
- Smallest possible change

### 4. Re-test

Track: cycle number, previously fixed tests (should still pass), new failures, regressions (→ REVERT).

### 5. Loop or Escalate

```
ALL PASS → commit fixes
cycle < 5 → go to step 2
cycle = 5 → STOP, report:
  - Fixed tests
  - Still-failing tests with what was attempted
```

## Report Format

After each cycle: `Cycle {N}/5: {passed}/{total} (+{fixed} fixed), remaining: {count}`

Final: command, cycles, result, fixed list, still-failing list, files changed.
