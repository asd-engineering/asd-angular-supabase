---
name: plan-with-checkpoints
description: Implement multi-step plans with todos per step, commits per step, and review checkpoints — prevents fire-and-forget failures
argument-hint: <plan description>
user-invocable: true
---

# Plan With Checkpoints

Execute a multi-step implementation plan with structured checkpoints: todo per step, commit per step, review every 3 steps, and automatic escalation when stuck.

**Data-backed:** 72% of stuck sessions are fire-and-forget plans where the agent runs without checkpoints. This skill enforces the pattern that makes the other 28% successful.

## Arguments

- `$ARGUMENTS` — the plan to implement. Can be:
  - A description: "Add dark mode with theme persistence"
  - A reference: "the plan from the previous message"
  - A ticket: "implement Redmine #1234"

## Phase 0: Plan Decomposition

Before writing any code, break the plan into numbered steps:

```
## Plan: {description}

Steps:
1. {step} — {expected outcome}
2. {step} — {expected outcome}
3. {step} — {expected outcome}
...

Estimated steps: {N}
Review checkpoints: after steps {3, 6, 9, ...}

Starting with step 1. Ready?
```

**Rules for step sizing:**

- Each step should be completable in 1-5 edits
- Each step should produce a testable or verifiable result
- Each step should build on the previous one
- If a step has >5 sub-tasks, split it

Present the plan and wait for user approval before starting.

## Phase 1: Execute Step

For each step:

### 1A: Create Todo

Mark the current step as in-progress using the TodoWrite tool:

```
[ ] Step 1: {description}
[ ] Step 2: {description}
[→] Step 3: {description}  ← current
```

### 1B: Implement

- Read existing code before editing
- Make the minimal change for this step
- Don't prepare for future steps
- Run relevant tests after the change

### 1C: Verify

After implementing, verify the step works:

```bash
# Run relevant tests
asd run check
asd run test-run

# Or manual verification
{VERIFY_COMMAND}
```

### 1D: Report

```
## Step {N}/{total}: {description}

**Status:** DONE
**Files changed:**
- `{file}`: {what changed}

**Verification:** {test results or manual check}
**Next:** Step {N+1}: {description}
```

### 1E: Commit

Every step gets its own commit:

```bash
git add {specific files}
git commit -m "{descriptive message for this step}"
```

**Never accumulate uncommitted steps.** If a commit fails (pre-commit hook), fix the issue and commit before continuing.

## Phase 2: Review Checkpoint

After every 3 steps, stop and present a review:

```
## Checkpoint: Steps {N-2} through {N}

### Changes so far
| Step | Description | Status | Commit |
|------|-------------|--------|--------|
| 1 | {desc} | DONE | abc1234 |
| 2 | {desc} | DONE | def5678 |
| 3 | {desc} | DONE | ghi9012 |

### Files touched
- `{file}` — {summary of all changes}

### Tests
- {test results since last checkpoint}

### Remaining
- Step 4: {desc}
- Step 5: {desc}
...

Continue, or do you want to adjust the remaining plan?
```

**CRITICAL: Actually stop and wait for user input.** Do not continue past a checkpoint without explicit approval.

## Phase 3: Stuck Detection

Track your progress. If any of these conditions occur, STOP and escalate:

| Condition                             | Threshold | Action                                     |
| ------------------------------------- | --------- | ------------------------------------------ |
| Same file edited >3 times in one step | 3 edits   | Stop — likely misunderstanding the problem |
| Test failing after 2 fix attempts     | 2 cycles  | Stop — need different approach             |
| Step taking >10 tool calls            | 10 calls  | Stop — step is too large, split it         |
| Build/type errors cascading           | 3+ files  | Stop — architectural issue                 |

### Escalation Format

```
## Stuck on Step {N}: {description}

**What I tried:**
1. {approach 1} — {why it didn't work}
2. {approach 2} — {why it didn't work}

**What's blocking:**
{Description of the obstacle}

**Options:**
A. {alternative approach}
B. {different approach}
C. Skip this step and continue

Which approach should I take?
```

## Phase 4: Completion

After all steps are done:

```
## Plan Complete

**Plan:** {description}
**Steps:** {completed}/{total}
**Commits:** {count}
**Review checkpoints:** {count}
**Stuck escalations:** {count}

### All Changes
| Step | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | {desc} | abc1234 | {files} |
| ... | ... | ... | ... |

### Test Results
{Final test run output}

### What's Left (if any)
- {Anything skipped or deferred}
```

## Decision Tree

```
Receive plan
├── Decompose into steps → present to user → wait for approval
│
├── For each step:
│   ├── Create todo → implement → verify → report → commit
│   ├── Every 3 steps → review checkpoint → wait for user
│   └── If stuck >2 cycles → escalate → wait for user
│
└── All steps done → final report
```

## Anti-Patterns This Skill Prevents

| Anti-Pattern               | How This Prevents It               |
| -------------------------- | ---------------------------------- |
| Fire-and-forget plan       | Review checkpoint every 3 steps    |
| No commits until "done"    | Commit after every step            |
| Stuck loop (same error 5x) | Stuck detection after 2 cycles     |
| Scope creep mid-plan       | Each step is pre-defined and sized |
| Lost progress on failure   | Per-step commits preserve work     |
| User surprise at end       | Incremental visibility via reports |
