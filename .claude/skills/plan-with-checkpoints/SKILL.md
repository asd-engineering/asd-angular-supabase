---
name: plan-with-checkpoints
description: Implement multi-step plans with todos per step, commits per step, and review checkpoints every 3 steps. Use for any task with 3+ steps to prevent fire-and-forget failures.
argument-hint: <plan description>
user-invocable: true
---

# Plan With Checkpoints

Break the plan into numbered steps, commit after each, review every 3.

## Phase 0: Decompose

Present the plan and **wait for user approval** before starting:

```
## Plan: {description}

1. {step} — {expected outcome}
2. {step} — {expected outcome}
3. {step} — {expected outcome}

Review checkpoints: after steps {3, 6, 9, ...}
Starting with step 1. Ready?
```

**Step sizing:** 1-5 edits each, testable result, builds on previous. Split if >5 sub-tasks.

## Phase 1: Execute Each Step

1. **Todo** — mark current step in-progress
2. **Implement** — read before editing, minimal change, no future-proofing
3. **Verify** — `asd run check` / `asd run test-run`
4. **Report** — files changed, verification result, next step
5. **Commit** — every step gets its own commit. Never accumulate.

## Phase 2: Review Checkpoint (every 3 steps)

```
## Checkpoint: Steps {N-2} through {N}

| Step | Description | Status | Commit |
|------|-------------|--------|--------|

Files touched, test results, remaining steps.
Continue, or adjust the remaining plan?
```

**CRITICAL: Stop and wait for user input.** Do not continue past a checkpoint.

## Phase 3: Stuck Detection

| Condition                  | Threshold | Action                              |
| -------------------------- | --------- | ----------------------------------- |
| Same file edited >3 times  | 3 edits   | Stop — misunderstanding the problem |
| Test failing after 2 fixes | 2 cycles  | Stop — need different approach      |
| Step taking >10 tool calls | 10 calls  | Stop — step too large, split it     |
| Type errors cascading      | 3+ files  | Stop — architectural issue          |

**Escalation:** State what you tried, what's blocking, and present 2-3 options. Wait for user.

## Phase 4: Completion

Report all steps, commits, test results, and anything skipped or deferred.
