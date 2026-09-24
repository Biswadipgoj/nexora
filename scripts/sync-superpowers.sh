#!/usr/bin/env bash
# Re-vendor the superpowers skills (https://github.com/obra/superpowers, MIT)
# into .claude/skills so they load in both local and cloud Claude Code sessions.
#
#   ./scripts/sync-superpowers.sh           # latest main
#   ./scripts/sync-superpowers.sh v6.4.1    # a tag or commit
set -euo pipefail

REF="${1:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.claude/skills"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --quiet https://github.com/obra/superpowers.git "$TMP/superpowers"
git -C "$TMP/superpowers" checkout --quiet "$REF"

for dir in "$TMP"/superpowers/skills/*/; do
  name="$(basename "$dir")"
  rm -rf "${DEST:?}/$name"
  cp -R "$dir" "$DEST/$name"
done
cp "$TMP/superpowers/LICENSE" "$DEST/SUPERPOWERS_LICENSE"

echo "Synced superpowers @ $(git -C "$TMP/superpowers" rev-parse --short HEAD) into .claude/skills"
