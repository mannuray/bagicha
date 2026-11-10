#!/usr/bin/env bash
# Structural rules from docs/coding-principles.md that a grep can enforce.
set -u
cd "$(dirname "$0")/.."
status=0

fail() { echo "✗ $1"; echo "$2" | sed 's/^/    /'; status=1; }

out=$(grep -rn "console\." src --include='*.ts' || true)
[ -n "$out" ] && fail "console.* in src (use the injected pino logger)" "$out"

out=$(grep -rnE "prisma\.(plant|journalEntry|plantCycle|task|diagnosisSession|diagnosisOutcome|personalizedOverlay)\b" src --include='*.ts' | grep -v -e "/repositories/" -e "\.repository\.ts" || true)
[ -n "$out" ] && fail "user-owned tables queried outside a repository" "$out"

out=$(grep -rn "new Date()" src/modules --include='*.ts' | grep -v -e "\.spec\.ts" -e "clock.ts" || true)
[ -n "$out" ] && fail "bare new Date() in business logic (inject Clock)" "$out"

out=$(grep -rn "throw new Error(" src --include='*.ts' | grep -v "\.spec\.ts" || true)
[ -n "$out" ] && fail "throw new Error(...) (use the AppError hierarchy)" "$out"

node scripts/check-module-imports.js || status=1

[ $status -eq 0 ] && echo "boundaries: ok"
exit $status
