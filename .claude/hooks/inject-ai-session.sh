#!/bin/bash
# Inject AI Session — adds audit metadata when AI creates tickets/issues.
# Appends "[AI-assisted: Claude Code session <id>]" context.

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# For MCP tools (Redmine), modify the tool input
if [[ "$TOOL_NAME" == mcp__pma__redmine_create_ticket ]]; then
  DESCRIPTION=$(echo "$INPUT" | jq -r '.tool_input.description // ""')
  NEW_DESC="${DESCRIPTION}

---
_AI-assisted: Claude Code session ${SESSION_ID}_"

  jq -n --arg desc "$NEW_DESC" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      updatedInput: { description: $desc }
    }
  }'
  exit 0
fi

# For Bash commands (gh/glab), the body is inline in the command string.
# Modifying it would be fragile. Instead, CLAUDE.md instructs the agent
# to include the AI session footer when creating tickets.
exit 0
