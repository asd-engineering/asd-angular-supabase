---
name: bug-diagnosis
description: Structured bug diagnosis — symptom analysis, root cause tracing, fix verification. Prevents the "just fix it" anti-pattern.
argument-hint: <symptom description>
user-invocable: true
---

# Bug Diagnosis

Structured workflow for diagnosing and fixing bugs. Enforces "understand before fixing" — the single most important pattern for avoiding stuck sessions.

**Data-backed:** "fix" prompts are 2x overrepresented in stuck sessions (28% vs 14% in effective ones). The difference: effective sessions diagnose first, stuck sessions fix first.

## Arguments

- `$ARGUMENTS` — description of the bug. Can be:
  - A symptom: "login redirects to blank page"
  - An error message: "TypeError: Cannot read properties of undefined"
  - A reference: "issue #1234" or "the deploy broke billing"

## Phase 1: Gather Evidence (NO code changes)

**CRITICAL: Do not edit any code during this phase.**

### 1A: Clarify the Bug

If the symptom is vague, ask the user for:

- **What happened?** (actual behavior)
- **What should happen?** (expected behavior)
- **When did it start?** (after a deploy? a code change? always?)
- **How to reproduce?** (steps, URL, input data)

If the user already provided this info, skip to 1B.

### 1B: Check Recent Changes

```bash
# What changed recently?
git log --oneline -20

# What files changed in the last commit?
git diff HEAD~1 HEAD --stat

# Any relevant branch activity?
git log --all --oneline --since="2 days ago" --format="%h %s (%an, %ar)"
```

### 1C: Check Logs

Depending on where the bug manifests:

**Browser errors:**

- MCP Playwright → navigate to page → check console errors
- Or: ask user for browser console output

**Server errors:**

```bash
# Supabase logs
# Use Supabase MCP: get_logs service="api"

# Production Docker logs (if SSH available)
ssh asd.host "docker logs {container} --since 1h 2>&1 | tail -50"

# Dev server output
# Check the terminal running `asd run dev`
```

**CLI errors:**

```bash
# Run with verbose/debug flag
asd --verbose {command} 2>&1
```

### 1D: Reproduce (if possible)

Try to reproduce the bug locally:

- Start dev server if needed
- Follow the user's reproduction steps
- Capture the actual error output

## Phase 2: Trace the Code Path

Starting from the symptom, trace backwards through the code:

### 2A: Find the Entry Point

| Symptom Type  | Entry Point                                                     |
| ------------- | --------------------------------------------------------------- |
| Page error    | `src/app/features/{feature}/` component or route                |
| API error     | Supabase edge function or `src/app/core/services/`              |
| Auth error    | `src/app/core/services/auth.service.ts` or Supabase auth config |
| Route error   | `src/app/app.routes.ts` or `app.routes.server.ts`               |
| DB error      | Migration files + RLS policies                                  |
| Payment error | Edge functions + webhook handler                                |

### 2B: Read the Code Path

Read files in order of execution:

1. Entry point (component, service, route guard)
2. Called functions (imports, shared services)
3. Data layer (Supabase queries, edge functions)
4. Configuration (env vars, asd.yaml, supabase config)

Use Grep to find related code:

```
Pattern: {error message text}
Pattern: {function name from stack trace}
Pattern: {variable name that's undefined}
```

### 2C: Identify the Root Cause

After reading the code path, state the root cause clearly:

```
## Diagnosis

**Symptom:** {what the user sees}
**Root cause:** {what's actually wrong}
**Location:** {file}:{line}
**Why:** {explanation of why this causes the symptom}

**Evidence:**
- {log line showing the error}
- {code line with the bug}
- {config value that's wrong}
```

Present this to the user BEFORE making any fixes.

## Phase 3: Fix

Only after the user confirms the diagnosis (or if the root cause is obvious):

### 3A: Plan the Fix

```
## Proposed Fix

**Change:** {what to change}
**Files:** {which files}
**Risk:** {what else might this affect}
**Test:** {how to verify the fix}
```

### 3B: Apply the Fix

- Make the minimal change to fix the root cause
- Don't refactor surrounding code
- Don't fix other unrelated issues you noticed
- Don't add defensive code "just in case"

### 3C: Verify the Fix

1. **Reproduce the bug again** — it should be gone
2. **Run related tests** — nothing else should break
3. **Check edge cases** — does the fix handle similar inputs?

```bash
# Run verification sequence
asd run check
asd run test-run
```

## Phase 4: Report

```markdown
## Bug Fix Report

**Symptom:** {description}
**Root Cause:** {what was wrong}
**Fix:** {what was changed}
**Verification:** {how it was tested}

### Files Changed

- `{file}`: {what changed and why}

### Regression Risk

- {any areas that might be affected by this change}
```

Commit the fix with a descriptive message:

```bash
git commit -m "fix: {short description of what was wrong and what was fixed}"
```

## Decision Tree

```
Bug report received
  ├── Symptom clear? → Phase 1B (check changes)
  ├── Symptom vague? → Phase 1A (clarify with user)
  │
  ├── Recent change correlates? → Read the diff, check if it's the cause
  ├── No recent change? → Phase 1C (check logs for error patterns)
  │
  ├── Error in logs? → Phase 2 (trace from error location)
  ├── No error? → Phase 2 (trace from user's reproduction steps)
  │
  ├── Root cause found? → Present diagnosis, wait for confirmation
  ├── Root cause unclear? → Ask user for more info, try different traces
  │
  └── Fix confirmed? → Phase 3 (minimal fix + verify)
```

## Common Bug Categories in This Project

| Category              | Typical Root Cause                                    | Where to Look                                               |
| --------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Auth/redirect         | Token expired, wrong redirect URL, RLS policy         | `src/app/core/services/auth.service.ts`, Supabase dashboard |
| UI not rendering      | Signal not updating, missing async pipe, wrong import | Component file, check signal usage                          |
| API 500               | Missing env var, DB query error, type mismatch        | Edge functions, check Supabase logs                         |
| Payment error         | Mollie webhook not arriving, wrong tunnel URL         | Edge functions, tunnel logs                                 |
| Tunnel not connecting | Wrong port, DNS, tunnel token expired                 | asd.yaml, `asd tunnel status`                               |
| Deploy broken         | Docker build failure, wrong env, migration issue      | Dockerfile, CI logs, migration files                        |
