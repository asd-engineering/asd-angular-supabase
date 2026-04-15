---
name: code-review-agent
description: Review changed files for bugs, security issues, and quality problems with confidence-based filtering (>80% only). Use before committing or merging to catch real issues.
argument-hint: [files|branch|commit]
user-invocable: true
---

# Code Review Agent

Read changed files, check for security vulnerabilities, logic bugs, type issues. Only report issues with >80% confidence.

## Phase 1: Gather Changes

- **Default** (no args): `git diff HEAD --stat` (staged + unstaged)
- **Branch**: `git diff main...HEAD --name-only`
- **Commit**: `git show {commit} --stat`

## Phase 2: Read and Analyze

Read the **full file** (not just diff) for context. Check:

### Security (Critical)

| Check                                    | Severity |
| ---------------------------------------- | -------- |
| Unsanitized input in SQL/shell/HTML      | CRITICAL |
| Missing auth checks, broken RLS policies | CRITICAL |
| Secrets in code or logs                  | CRITICAL |
| `[innerHTML]` without sanitization       | HIGH     |

### Logic Bugs

| Check                                        | Severity |
| -------------------------------------------- | -------- |
| Missing null checks on optional values       | HIGH     |
| Race conditions (async without proper await) | HIGH     |
| Off-by-one errors                            | HIGH     |

### Angular + ASD Patterns

| Check                                                              | Severity |
| ------------------------------------------------------------------ | -------- |
| `signal()`, `computed()`, `effect()` misuse                        | HIGH     |
| New tables missing RLS policies                                    | CRITICAL |
| Protected routes missing `CanActivateFn` guards                    | HIGH     |
| Client-only code without `afterNextRender` or correct `RenderMode` | HIGH     |
| Hardcoded URLs instead of `buildTunnelAddress()`                   | MEDIUM   |

## Phase 3: Confidence Filter

| Confidence | Report?          |
| ---------- | ---------------- |
| 90-100%    | YES — as issue   |
| 80-89%     | YES — as warning |
| 60-79%     | NO               |
| <60%       | NO               |

**Increases confidence:** matches known vuln pattern, contradicts type annotations, test contradicts change.
**Decreases confidence:** existing tests pass, framework handles it (Angular sanitizes by default), comment explains why.

## Phase 4: Report

Only >80% confidence issues:

```
## Code Review

**Scope:** {description}  **Files:** {count}  **Issues:** {count}

### Critical
{file}:{line} — {what} — {why it matters} — {fix}

### Warnings
{file}:{line} — {what} — {fix}
```

Do not report: style issues, TODOs, <80% confidence, framework-handled concerns.
