---
name: iterative-test-agent
description: Run tests, parse failures, fix code, re-test — automated edit/test/fix cycle with max 5 iterations before escalating to user
argument-hint: [test-command|scope]
user-invocable: true
---

# Iterative Test Agent

Automated test→fix→retest cycle. Runs your test suite, parses failures, reads the failing code, applies fixes, and re-runs until green or 5 cycles exceeded.

**Data-backed:** 94% of iterative dev sessions produce commits. This skill codifies that pattern.

## Arguments

- `$ARGUMENTS` — what to test. Can be:
  - A scope: `unit`, `e2e`, `payment`, `check`
  - A specific test file: `src/app/features/auth/auth.spec.ts`
  - Empty — runs `asd run check` + `asd run test-run`

## Step 0: Detect Test Command

**Always use `asd run` or `just` recipes. Never run raw test commands.**

| Scope            | Command                     | Framework    |
| ---------------- | --------------------------- | ------------ |
| Lint + typecheck | `asd run check`             | ESLint + tsc |
| Unit tests       | `asd run test-run`          | Vitest       |
| E2E (Chromium)   | `asd run test-e2e-chromium` | Playwright   |
| Payment flow     | `asd run test-payment`      | Playwright   |

## Step 1: Run Tests (Initial)

Run the test command and capture output:

```bash
asd run test-run 2>&1 | tail -100
```

**Parse the output:**

- Count total tests, passed, failed, skipped
- Extract failing test names and error messages
- If ALL PASS: report success and exit

## Step 2: Analyze Failures (per failing test)

For each failure, extract:

1. **Test name** — which test failed
2. **Error message** — assertion error, exception, timeout
3. **Stack trace** — file:line of failure
4. **Expected vs Actual** — if assertion-based

Then read the source files:

- Read the test file at the failing line
- Read the source code being tested (trace imports)
- Understand what the test expects vs what the code does

## Step 3: Fix

Apply the minimal fix. Priority order:

1. **Source code fix** — if the code has a bug
2. **Test update** — if the test is outdated (API changed, component renamed)
3. **Config fix** — if environment/config is wrong

**Rules:**

- Fix ONE failure at a time (related failures may resolve together)
- Never delete or skip a test — fix it
- Never add `.skip` or `xdescribe` annotations
- Prefer the smallest possible change

## Step 4: Re-test

Run the same test command again. Track:

- Cycle number (1-5)
- Previously fixed tests (should still pass)
- New failures (may have been unmasked)
- Regressions (previously passing test now fails → REVERT last change)

## Step 5: Loop or Escalate

```
IF all tests pass:
    → Report success with summary of fixes
    → Commit the fixes (small, focused commit message)
ELSE IF cycle < 5:
    → Go to Step 2 with remaining failures
ELSE:
    → STOP. Report to user:
      - Which tests pass now (were fixed)
      - Which tests still fail (need human input)
      - What was attempted and why it didn't work
```

## Output Format

After each cycle, briefly report:

```
Cycle {N}/5: {passed}/{total} passing (+{fixed_this_cycle} fixed)
  Fixed: {test_name} — {what was wrong}
  Remaining: {count} failures
```

Final report:

```
## Test Fix Summary

**Command:** {test_command}
**Cycles:** {N}
**Result:** {ALL PASS | {N} still failing}

### Fixed ({count})
- {test}: {description of fix} ({file}:{line})

### Still Failing ({count}) — needs human input
- {test}: {error} — Attempted: {what was tried}

### Files Changed
- {file}: {description}
```

## Anti-Patterns to Avoid

- **Don't shotgun-fix:** Read and understand the error before editing
- **Don't weaken tests:** Fix the code, not the assertions (unless test is genuinely wrong)
- **Don't chain Bash calls:** Use Read to understand code, then Edit to fix, then Bash to test
- **Don't ignore flaky tests:** If a test passes intermittently, flag it as flaky rather than "fixed"
- **Don't fix unrelated code:** Only touch files related to the failing test
