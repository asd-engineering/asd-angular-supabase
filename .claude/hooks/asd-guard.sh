#!/bin/bash
# ASD Network Guard — prompts before exposing services or creating tunnels.
# These operations make local services reachable from the internet.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

ask() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

re_asd_expose='asd expose'
re_asd_tunnel='asd net apply --tunnel'
re_asd_tunnel_alt='asd net apply.*--tunnel'

if [[ "$COMMAND" =~ $re_asd_expose ]]; then
  ask "asd expose makes local services reachable from the internet: $COMMAND"
fi

if [[ "$COMMAND" =~ $re_asd_tunnel ]] || [[ "$COMMAND" =~ $re_asd_tunnel_alt ]]; then
  ask "asd net apply --tunnel creates a tunnel connection to ASD servers: $COMMAND"
fi

exit 0
