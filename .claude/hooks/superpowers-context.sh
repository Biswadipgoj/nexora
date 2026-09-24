#!/usr/bin/env bash
# SessionStart: inject the superpowers bootstrap skill, mirroring the upstream
# superpowers plugin hook (https://github.com/obra/superpowers) so the vendored
# skills in .claude/skills behave the same in cloud and local sessions.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SKILL="$ROOT/.claude/skills/using-superpowers/SKILL.md"

[ -f "$SKILL" ] || exit 0

escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

content=$(escape_for_json "$(cat "$SKILL")")
context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${content}\n</EXTREMELY_IMPORTANT>"

printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$context"
