#!/bin/bash
# SessionStart: install npm dependencies so lint, typecheck, tests and the
# build work immediately in Claude Code on the web sessions.
set -euo pipefail

# Local machines manage their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` (not `npm ci`) so the cached container's node_modules is reused.
# Output goes to stderr so it never pollutes hook stdout.
npm install --no-audit --no-fund --loglevel=error 1>&2
