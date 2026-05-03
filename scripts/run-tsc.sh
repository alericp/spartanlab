#!/usr/bin/env bash
# Run TypeScript compiler in noEmit mode and produce a focused summary.
# - Total diagnostic count
# - Top 25 files by diagnostic count
# - All diagnostics for the target files
# - First 60 raw diagnostics (so the assistant can see exact lines)

set +e
cd "$(dirname "$0")/.."

OUT_FILE="/tmp/tsc-output.txt"
pnpm exec tsc --noEmit --pretty false 2>&1 > "$OUT_FILE"

echo "===== TOTAL DIAGNOSTICS ====="
grep -c "error TS" "$OUT_FILE" || echo 0

echo ""
echo "===== TOP 25 FILES BY DIAGNOSTIC COUNT ====="
grep -E "error TS" "$OUT_FILE" | sed -E 's/\(.*$//' | sort | uniq -c | sort -rn | head -25

echo ""
echo "===== lib/program-exercise-selector.ts DIAGNOSTICS ====="
grep "lib/program-exercise-selector.ts" "$OUT_FILE" | head -120

echo ""
echo "===== lib/canonical-profile-service.ts DIAGNOSTICS ====="
grep "lib/canonical-profile-service.ts" "$OUT_FILE" | head -60

echo ""
echo "===== lib/adaptive-program-builder.ts DIAGNOSTICS (first 60) ====="
grep "lib/adaptive-program-builder.ts" "$OUT_FILE" | head -60

echo ""
echo "===== FIRST 25 DIAGNOSTICS OVERALL ====="
grep "error TS" "$OUT_FILE" | head -25
