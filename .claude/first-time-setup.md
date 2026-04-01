# First-Time Project Setup (for AI agents)

This file is read by Claude Code **only once** — when the `project_setup_done` key is missing from Claude memory. After running through this setup, store the results in memory so this file is never loaded again.

## Auto-Detection Steps

### 1. Detect Git Provider

```bash
# Check remote URL
git remote get-url origin
```

- Contains `github.com` → provider = `github`
- Contains `gitlab.com` or self-hosted GitLab → provider = `gitlab`
- Contains `bitbucket.org` → provider = `bitbucket`

### 2. Detect Ticket System

```bash
# Check CLI availability
which gh    # GitHub CLI
which glab  # GitLab CLI
```

- `gh` available + github provider → ticket system = `github-issues`, CLI = `gh issue`, prefix = `#`
- `glab` available + gitlab provider → ticket system = `gitlab-issues`, CLI = `glab issue`, prefix = `#`
- Neither → ask user: "Which ticket system do you use? (jira, redmine, linear, none)"

For Jira/Redmine, also ask for the ticket prefix (e.g., `PROJ-`, `ASD-`).

### 3. Detect Org/Project

```bash
# Extract from remote URL
git remote get-url origin | sed 's/.*[:/]\([^/]*\/[^/]*\)\.git/\1/'
```

### 4. Confirm with User

Present detected values and ask user to confirm or override.

## How Claude Uses This Config

- **Commit messages** reference tickets: `fix: resolve payment timeout (#42)` or `fix: resolve payment timeout (PROJ-42)`
- **Issue CLI**: `gh issue list` / `glab issue list` to check open work
- **PR linking**: `gh pr create --body "Closes #42"` or equivalent
- **Creating tickets**: Use the configured system when user says "make a ticket for this"

## Memory Format

After setup, store in Claude memory:

```
## Project Setup
- Git provider: github
- Ticket system: github-issues
- Ticket prefix: #
- Ticket CLI: gh issue
- Org/project: asd-engineering/asd-angular-supabase
- project_setup_done: true
```
