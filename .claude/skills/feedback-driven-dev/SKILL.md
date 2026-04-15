---
name: feedback-driven-dev
description: Implement features in small increments — show result after each piece, wait for user feedback before continuing. Use for interactive feature development to prevent fire-and-forget.
argument-hint: <feature description>
user-invocable: true
---

# Feedback-Driven Development

Implement one piece at a time. Show result. Wait for feedback. Repeat.

## Step 0: Decompose

Break into small pieces (1-3 edits each, visible result):

```
I'll implement this in {N} pieces. After each one I'll show you the result.

1. {piece} — {what you'll see}
2. {piece} — {what you'll see}

Starting with piece 1. Ready?
```

## Step 1: Implement One Piece

- Read before writing
- Minimal changes, only this piece
- No forward-reaching
- Run `asd run check` after

## Step 2: Show Result

```
## Piece {N}/{total}: {description}

**Files changed:** {list}
**What it does:** {brief}
**How to verify:** {what to check}
**Next piece:** {description}

Want me to continue, or do you have feedback?
```

## Step 3: Wait for Feedback

**CRITICAL: Actually stop and wait.** Do not continue to the next piece.

- "continue" → next piece
- Specific feedback → apply, re-show, wait again
- "change approach" → re-evaluate remaining pieces
- "stop here" → commit what's done

## Step 4: Commit

Commit after every 2-3 approved pieces. **Never accumulate more than 3 uncommitted pieces.**

## Completion

Report feature status, commits, feedback rounds, remaining pieces (if stopped early).
