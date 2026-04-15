---
name: bug-diagnosis
description: Structured bug diagnosis — symptom analysis, root cause tracing, fix verification. Use when investigating bugs to prevent the "just fix it" anti-pattern.
argument-hint: <symptom description>
user-invocable: true
---

# Bug Diagnosis

Understand before fixing. Diagnose → confirm → fix → verify.

## Phase 1: Gather Evidence (NO code changes)

**Do not edit any code during this phase.**

1. **Clarify** — if vague, ask: what happened, what should happen, when it started, how to reproduce
2. **Check recent changes** — `git log --oneline -20`, `git diff HEAD~1 HEAD --stat`
3. **Check logs** — browser console (via Playwright), `get_logs service="api"` (Supabase MCP), or dev server output
4. **Reproduce** — try to trigger the bug locally

## Phase 2: Trace the Code Path

### Entry Points

| Symptom       | Where to look                                            |
| ------------- | -------------------------------------------------------- |
| Page error    | `src/app/features/{feature}/`                            |
| API error     | Edge functions or `src/app/core/services/`               |
| Auth error    | `src/app/core/services/auth.service.ts`, Supabase config |
| Route error   | `src/app/app.routes.ts`, `app.routes.server.ts`          |
| DB error      | Migrations + RLS policies                                |
| Payment error | Edge functions + webhook handler                         |

Read files in execution order: entry point → called functions → data layer → config. Use Grep to find error messages, function names, undefined variables.

### Present Diagnosis

```
**Symptom:** {what the user sees}
**Root cause:** {what's actually wrong}
**Location:** {file}:{line}
**Why:** {explanation}
**Evidence:** {log lines, code, config}
```

**Present to user BEFORE making any fixes.**

## Phase 3: Fix

After diagnosis is confirmed:

1. **Plan** — what to change, which files, what might break
2. **Apply** — minimal change to fix root cause. No refactoring.
3. **Verify** — reproduce (should be gone), `asd run check`, `asd run test-run`
4. **Commit** — `fix: {what was wrong and what was fixed}`
