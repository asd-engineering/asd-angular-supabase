# Claude Code Hooks

PreToolUse hooks that run before every Bash tool call.

| Hook                   | Purpose                                                                     | Overhead                          |
| ---------------------- | --------------------------------------------------------------------------- | --------------------------------- |
| `asd-guard.sh`         | Prompts before `asd expose` or `asd net apply --tunnel` (internet exposure) | ~2ms                              |
| `inject-ai-session.sh` | Adds AI session audit trail to ticket creation                              | ~2ms                              |
| `asd-validator.sh`     | Validates ASD CLI commands against cached `asd help` output                 | ~2ms non-asd, ~120ms asd commands |

## asd-validator.sh

Catches hallucinated or mistyped `asd` subcommands before they fail. On first `asd` command, caches all valid commands from `asd help` to `.asd/workspace/hooks/`. Cache auto-refreshes when `asd --version` changes.

**Skipped:** `asd run *` (tasks from asd.yaml), global flags (`--version`, `--help`), non-asd commands.

**Deny output:** Returns JSON with `permissionDecision: "deny"` and suggestions for the correct subcommand.
