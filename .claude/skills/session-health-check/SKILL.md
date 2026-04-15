---
name: session-health-check
description: Detect anti-patterns mid-session — repeated failures, stuck on same file, no commits — and suggest strategy switches. Use when feeling stuck or after 10+ messages without progress.
user-invocable: true
---

# Session Health Check

Detect anti-patterns and suggest strategy switches before they waste time.

## When to Run

- After 10+ messages without a commit
- After 3+ failed Bash commands in a row
- When editing the same file for the 4th+ time
- Periodically in long sessions (~every 30 minutes)

## Anti-Patterns

### 1. Bash Loop (3+ consecutive errors)

Stop running commands. Read the error. Check for `asd run` / `just` recipe. Ask user if environment issue.

### 2. Same-File Edit Loop (4+ edits without test)

Stop editing. Read the full file + related files. Run `asd run check`. Consider different approach.

### 3. No Commits (10+ messages with changes)

Working? Commit now, even if incomplete. Not working? Revert and try different approach. Unsure? Run `asd run test-run`.

### 4. Growing Scope (working on unrequested tasks)

Stop. Compare current work vs original request. Finish original task first. Note other issues for later.

### 5. Plan Without Execution (5+ messages, no code)

Start with the smallest piece. Write code for step 1. Let code drive the discussion.

### 6. Fire-and-Forget (large plan, no checkpoints)

Switch to `/plan-with-checkpoints`. Break remaining work into pieces with verification.

## Report Format

```
## Session Health Check

**Messages:** {count}  **Commits:** {count}

| Pattern | Status | Severity |
|---------|--------|----------|

### Recommendations
1. {strategy switch}
2. {strategy switch}
```

## Reference: Effective vs Stuck Sessions

| Trait              | Effective           | Stuck      |
| ------------------ | ------------------- | ---------- |
| Commits            | Every 5-10 messages | None       |
| Course corrections | Frequent            | None       |
| Verification       | After each change   | At the end |
