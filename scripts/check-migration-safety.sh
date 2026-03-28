#!/usr/bin/env bash
set -euo pipefail

BASE_SHA="${1:-}"
HEAD_SHA="${2:-HEAD}"
OVERRIDE_TOKEN="safety:allow-destructive"

if [[ -z "$BASE_SHA" || "$BASE_SHA" =~ ^0+$ ]]; then
  if git rev-parse "$HEAD_SHA^" >/dev/null 2>&1; then
    BASE_SHA="$(git rev-parse "$HEAD_SHA^")"
  else
    echo "No base commit available; skipping migration safety check."
    exit 0
  fi
fi

MIGRATIONS="$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" -- 'supabase/migrations/*.sql')"

if [[ -z "$MIGRATIONS" ]]; then
  echo "No migration files changed."
  exit 0
fi

COUNT="$(printf '%s\n' "$MIGRATIONS" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "Checking migration safety for $COUNT file(s)."

RISK_PATTERNS=(
  'drop[[:space:]]+table'
  'truncate[[:space:]]+table'
  'drop[[:space:]]+schema'
  'drop[[:space:]]+database'
  'alter[[:space:]]+table.*drop[[:space:]]+column'
)

FAILED=0
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ -f "$file" ]] || continue

  if grep -Eiq "$OVERRIDE_TOKEN" "$file"; then
    echo "Override token found in $file; skipping destructive-pattern block."
    continue
  fi

  for pattern in "${RISK_PATTERNS[@]}"; do
    if grep -Eiq "$pattern" "$file"; then
      echo "::error file=$file::Potentially destructive SQL detected ($pattern). Add '$OVERRIDE_TOKEN' with justification or split into a manually reviewed migration."
      FAILED=1
      break
    fi
  done
done <<< "$MIGRATIONS"

if [[ $FAILED -ne 0 ]]; then
  echo "Migration safety check failed."
  exit 1
fi

echo "Migration safety check passed."
