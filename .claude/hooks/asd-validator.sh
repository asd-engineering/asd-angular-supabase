#!/bin/bash
# ASD CLI Command Validator — checks commands against cached help output.
# Zero AI tokens, <10ms after first cache build (~150ms).

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[[ "$COMMAND" =~ ^asd\  ]] || exit 0

CACHE_DIR=".asd/workspace/hooks"
VERSION_CACHE="${CACHE_DIR}/asd-version.cache"
COMMANDS_CACHE="${CACHE_DIR}/asd-commands.cache"

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Build/refresh cache (runs asd help once per CLI version)
ensure_cache() {
  local ver
  ver=$(asd --version 2>/dev/null | head -1) || exit 0  # CLI not installed → skip

  if [ -f "$VERSION_CACHE" ] && [ -f "$COMMANDS_CACHE" ]; then
    [ "$(cat "$VERSION_CACHE")" = "$ver" ] && return 0
  fi

  mkdir -p "$CACHE_DIR"
  # Parse: "     module subcommand - description" → "module subcommand"
  asd help 2>/dev/null \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^\s+[a-z]' \
    | sed 's/ - .*//' \
    | sed 's/^[[:space:]]*//' \
    > "$COMMANDS_CACHE"
  echo "$ver" > "$VERSION_CACHE"
}

ensure_cache

# Parse: "asd <module> <subcommand> [flags...]"
read -ra PARTS <<< "$COMMAND"
MODULE="${PARTS[1]:-}"
SUBCMD="${PARTS[2]:-}"

[ -z "$MODULE" ] && exit 0

# Skip global flags (--version, --help, etc.)
[[ "$MODULE" =~ ^- ]] && exit 0

# Skip validation for asd run (project-specific tasks from asd.yaml)
[ "$MODULE" = "run" ] && exit 0

# Check module exists (either as "module subcmd" or standalone "module")
if ! grep -q "^${MODULE}" "$COMMANDS_CACHE" 2>/dev/null; then
  deny "Unknown ASD module: '${MODULE}'. Run 'asd help' to see available commands."
fi

# Skip subcommand validation for standalone commands (no subcommands in cache)
if ! grep -q "^${MODULE} " "$COMMANDS_CACHE" 2>/dev/null; then
  exit 0
fi

# Skip if SUBCMD looks like a shell redirect/pipe
if [ -n "$SUBCMD" ] && [[ "$SUBCMD" =~ ^[0-9\>\<\|] ]]; then
  exit 0
fi

# If subcommand given, check "module subcommand" combo exists
if [ -n "$SUBCMD" ] && [[ ! "$SUBCMD" =~ ^- ]]; then
  if ! grep -qx "${MODULE} ${SUBCMD}" "$COMMANDS_CACHE" 2>/dev/null; then
    SUGGESTIONS=$(grep "^${MODULE} " "$COMMANDS_CACHE" 2>/dev/null | sed 's/^/  asd /' | head -5)
    MSG="Unknown: 'asd ${MODULE} ${SUBCMD}'."
    [ -n "$SUGGESTIONS" ] && MSG="${MSG}\n\nAvailable:\n${SUGGESTIONS}"
    deny "$MSG"
  fi
fi

exit 0
