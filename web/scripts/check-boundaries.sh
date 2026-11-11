#!/usr/bin/env bash
# Structural rules (docs/coding-principles.md, spec §6) a grep can enforce.
set -u
cd "$(dirname "$0")/.."
status=0
fail() { echo "✗ $1"; echo "$2" | sed 's/^/    /'; status=1; }

out=$(grep -rn "console\." src --include='*.ts' --include='*.tsx' | grep -v -e "src/lib/report-error.ts" -e "\.test\.tsx\?:" -e "src/test/" || true)
[ -n "$out" ] && fail "console.* in app code (use lib/report-error)" "$out"

out=$(grep -rn "throw new Error(" src --include='*.ts' --include='*.tsx' | grep -v -e "\.test\.tsx\?:" -e "src/test/" || true)
[ -n "$out" ] && fail "throw new Error(...) in app code (use ApiError / AppStateError)" "$out"

out=$(grep -rnE "from ['\"]msw" src --include='*.ts' --include='*.tsx' | grep -v -e "src/test/" -e "\.test\.tsx\?:" || true)
[ -n "$out" ] && fail "msw imported outside tests (no mock data in the shipped app)" "$out"

out=$(grep -rn "seasonal/weather" src --include='*.ts' --include='*.tsx' | grep -v -e "\.test\.tsx\?:" -e "src/test/" || true)
[ -n "$out" ] && fail "the app must not call seasonal/weather (mock data)" "$out"

# One clock per app (lib/clock): screens take "now" from useNow() or a prop, never read it.
out=$(grep -rnE "systemClock|new Date\(\)|Date\.now\(\)" src --include='*.ts' --include='*.tsx' | grep -v -e "src/lib/clock.ts" -e "src/app/providers.tsx" -e "\.test\.tsx\?:" -e "src/test/" || true)
[ -n "$out" ] && fail "the clock read outside lib/clock (use useNow() or a now prop)" "$out"

# What a change makes stale is decided in one place (lib/stale): features name the change.
out=$(grep -rn "invalidateQueries" src --include='*.ts' --include='*.tsx' | grep -v -e "src/lib/stale.ts" -e "\.test\.tsx\?:" -e "src/test/" || true)
[ -n "$out" ] && fail "invalidateQueries outside lib/stale (use staleAfter + useInvalidate)" "$out"

node scripts/check-domain-imports.js || status=1
[ $status -eq 0 ] && echo "boundaries: ok"
exit $status
