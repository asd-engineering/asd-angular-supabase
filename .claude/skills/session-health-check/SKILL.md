---
name: session-health-check
description: Detect anti-patterns mid-session — repeated Bash failures, stuck on same file, no commits — and suggest strategy switches
user-invocable: true
---

# Session Health Check

Detect common anti-patterns during a Claude Code session and suggest strategy switches before they waste time. Run this when you feel stuck or when a session seems unproductive.

**Data-backed:** Analysis of 1,665 sessions shows clear patterns: effective sessions average 94% commit rate with frequent course corrections; stuck sessions loop on the same error 5+ times without changing approach.

## When to Run This

- After 10+ messages without a commit
- After 3+ failed Bash commands in a row
- When editing the same file for the 4th+ time
- When you're not sure if you're making progress
- Periodically in long sessions (every 30 minutes)

## Anti-Pattern Detection

### Pattern 1: Bash Loop

**Signal:** 3+ consecutive Bash tool calls that return errors.

**Diagnosis:** Likely trying to brute-force a command that won't work. Common causes:

- Wrong tool for the job (should use Read/Edit instead of sed/awk)
- Missing dependency or wrong environment
- Permission issue

**Strategy switch:**

- Stop running commands
- Read the error message carefully
- Check if there's an `asd run` or `just` recipe for what you're trying to do
- Ask the user if stuck on environment issues

### Pattern 2: Same-File Edit Loop

**Signal:** Same file edited 4+ times in the current task without a test run or verification step.

**Diagnosis:** Likely doesn't understand the code well enough. Making speculative edits that don't work.

**Strategy switch:**

- Stop editing
- Read the file completely (not just the area you're editing)
- Read related files (imports, callers, tests)
- Run `asd run check` to see what the actual error is
- Consider a different approach

### Pattern 3: No Commits

**Signal:** 10+ messages with code changes but no commit.

**Diagnosis:** Either the changes don't work yet (stuck) or the work is accumulating risk (if something goes wrong, all progress is lost).

**Strategy switch:**

- If changes work: commit now, even if incomplete — incremental commits are safe
- If changes don't work: revert to last good state and try a different approach
- If unsure: run `asd run test-run` to determine state

### Pattern 4: Growing Scope

**Signal:** Started with task A, now working on tasks B, C, D that weren't requested.

**Diagnosis:** Scope creep. Often triggered by noticing issues while working, leading to yak-shaving.

**Strategy switch:**

- Stop and list what you're currently working on
- Compare with what was originally requested
- Finish the original task first
- Note the other issues but don't fix them now

### Pattern 5: Plan Without Execution

**Signal:** Spent 5+ messages planning, designing, or discussing without writing any code.

**Diagnosis:** Analysis paralysis or unclear requirements.

**Strategy switch:**

- Start with the smallest possible piece
- Write code for step 1, show the user
- Let the code drive the discussion, not abstract planning

### Pattern 6: Fire-and-Forget

**Signal:** Implemented a large plan in one go without any checkpoints.

**Diagnosis:** The 72% pattern — most likely to fail and waste effort.

**Strategy switch:**

- Use `/plan-with-checkpoints` for the remaining work
- Break remaining work into small pieces with verification points
- Show results after each piece

## Health Check Report

```markdown
## Session Health Check

**Session length:** {message count} messages
**Duration:** ~{time estimate}
**Commits:** {count}

### Anti-Patterns Detected

| Pattern                | Status           | Severity          |
| ---------------------- | ---------------- | ----------------- |
| Bash loop              | {detected/clear} | {high/medium/low} |
| Same-file edit loop    | {detected/clear} | {high/medium/low} |
| No commits             | {detected/clear} | {high/medium/low} |
| Growing scope          | {detected/clear} | {high/medium/low} |
| Plan without execution | {detected/clear} | {high/medium/low} |
| Fire-and-forget        | {detected/clear} | {high/medium/low} |

### Recommendations

1. {Most important strategy switch}
2. {Second recommendation}

### Session Stats

- Tool calls: {approximate count}
- Files read: {count}
- Files edited: {count}
- Tests run: {count}
- Errors encountered: {count}
```

## Proactive Use

This skill can be called by other skills as a guard:

```
# In any long-running skill:
# After every 10 tool calls, consider running session-health-check
# to detect anti-patterns early.
```

## The Effective Session Pattern

For reference, effective sessions (94% commit rate) share these traits:

| Trait              | Effective           | Stuck                |
| ------------------ | ------------------- | -------------------- |
| Message count      | 186 avg             | 28 avg               |
| Course corrections | Frequent            | None                 |
| Commits            | Every 5-10 messages | None                 |
| User interaction   | Iterative           | One-shot             |
| Approach changes   | 1-2 per session     | 0                    |
| Verification       | After each change   | At the end (if ever) |

## Anti-Patterns to Avoid

- **Don't run this obsessively** — once every 30 minutes or when stuck is enough
- **Don't ignore the results** — if a pattern is detected, actually switch strategy
- **Don't use this as procrastination** — checking health is not the same as making progress
