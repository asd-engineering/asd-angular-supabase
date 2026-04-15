---
name: feedback-driven-dev
description: Implement features in small increments — show result after each piece, wait for user feedback before continuing. Prevents fire-and-forget plans.
argument-hint: <feature description>
user-invocable: true
---

# Feedback-Driven Development

Implement features incrementally with mandatory user checkpoints. Show each piece of work, wait for feedback, iterate.

**Data-backed:** Effective sessions average 186 messages with frequent course corrections. Ineffective sessions average 28 messages (fire-and-forget). This skill enforces the effective pattern.

## Why This Exists

72% of stuck sessions are plan-based where the agent was left alone too long. The fix: never implement more than one logical piece before showing the result to the user.

## Arguments

- `$ARGUMENTS` — what to implement. Should be a feature description, task, or reference to a plan.

## Step 0: Decompose into Pieces

Before writing any code, break the feature into small, independently verifiable pieces:

```
Feature: "Add dark mode toggle to settings page"

Pieces:
1. Create theme service with light/dark state
2. Add toggle component to settings UI
3. Wire CSS variables for theme switching
4. Persist preference to localStorage
5. Apply theme on page load
```

**Rules for decomposition:**

- Each piece should be completable in 1-3 edits
- Each piece should produce a visible or testable result
- Pieces should build on each other (not require all to work)
- If a piece has sub-pieces, split further

Present the decomposition to the user:

```
I'll implement this in {N} pieces. After each one I'll show you the result.

1. {piece 1} — {what you'll see}
2. {piece 2} — {what you'll see}
...

Starting with piece 1. Ready?
```

## Step 1: Implement One Piece

Implement the current piece. Follow these rules:

- **Read before writing:** Understand the existing code
- **Minimal changes:** Only edit what this piece requires
- **No forward-reaching:** Don't prepare for future pieces
- **Test if possible:** Run `asd run check` and `asd run test-run` after the change

## Step 2: Show Result

After implementing, present the result clearly:

```
## Piece {N}/{total}: {description}

**Files changed:**
- `src/app/core/services/theme.service.ts` (new) — theme service with signal
- `src/app/shared/components/theme-toggle/theme-toggle.component.ts` (new) — toggle component

**What it does:**
{Brief description of what changed and why}

**How to verify:**
{How the user can check it works — what to look for, what command to run}

**Next piece:** {description of what comes next}

Want me to continue, or do you have feedback on this piece?
```

## Step 3: Wait for Feedback

**CRITICAL: Actually stop and wait.** Do not continue to the next piece.

Possible user responses:

- **"continue" / "looks good" / "next"** → proceed to next piece
- **Specific feedback** → apply feedback, show updated result, wait again
- **"change approach"** → re-evaluate remaining pieces, adjust plan
- **"stop here"** → commit what's done, report status

## Step 4: Apply Feedback (if any)

When the user gives feedback:

1. Acknowledge what they want changed
2. Apply the change
3. Show the updated result (back to Step 2)
4. Wait for approval before moving on

## Step 5: Commit After Approval Cycles

Commit after every 2-3 approved pieces (or when the user says to commit):

```bash
git add {specific files}
git commit -m "{descriptive message covering the approved pieces}"
```

**Never accumulate more than 3 uncommitted pieces.** If the user has approved 3 pieces without a commit, commit before continuing.

## Step 6: Repeat Until Done

Continue the cycle until all pieces are implemented or the user decides to stop.

## Final Report

```
## Implementation Complete

**Feature:** {description}
**Pieces:** {completed}/{total}
**Commits:** {count}
**User feedback incorporated:** {count} rounds

### Summary of Changes
- {file}: {what changed}

### What's Left (if stopped early)
- {remaining pieces}
```

## Anti-Patterns This Skill Prevents

| Anti-Pattern                         | How This Skill Prevents It                |
| ------------------------------------ | ----------------------------------------- |
| Fire-and-forget plan                 | Mandatory checkpoint after each piece     |
| Implementing everything then showing | Stop after each piece, no exceptions      |
| Ignoring user feedback               | Explicit feedback loop with re-show       |
| Large uncommitted changes            | Auto-commit every 2-3 pieces              |
| Scope creep                          | Decomposition step limits scope per piece |
| "Fix" without understanding          | Read-first rule in each piece             |
