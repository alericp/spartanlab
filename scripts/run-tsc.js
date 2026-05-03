#!/usr/bin/env node
// Run TypeScript compiler in noEmit mode and emit a focused diagnostic
// summary so we can see remaining errors after the targeted edits.
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(new URL('.', import.meta.url).pathname, '..')

const result = spawnSync(
  'pnpm',
  ['exec', 'tsc', '--noEmit', '--pretty', 'false'],
  {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  },
)

const stdout = result.stdout || ''
const stderr = result.stderr || ''
const combined = stdout + stderr
writeFileSync('/tmp/tsc-output.txt', combined, 'utf-8')

const lines = combined.split('\n').filter((l) => l.includes('error TS'))

console.log('===== TOTAL DIAGNOSTICS =====')
console.log(lines.length)

const fileCounts = new Map()
for (const line of lines) {
  const file = line.split('(')[0]
  fileCounts.set(file, (fileCounts.get(file) || 0) + 1)
}
const sorted = [...fileCounts.entries()].sort((a, b) => b[1] - a[1])

console.log('\n===== TOP 25 FILES BY DIAGNOSTIC COUNT =====')
for (const [file, count] of sorted.slice(0, 25)) {
  console.log(`${String(count).padStart(5)}  ${file}`)
}

const targets = [
  'lib/program-exercise-selector.ts',
  'lib/canonical-profile-service.ts',
  'lib/adaptive-program-builder.ts',
  'lib/server/authoritative-program-generation.ts',
  'lib/prediction/prediction-service.ts',
  'app/(app)/program/page.tsx',
  'app/api/program/rebuild-adjustment/route.ts',
  'components/workout/StreamlinedWorkoutSession.tsx',
  'components/workouts/QuickLogModal.tsx',
  'components/workouts/WorkoutLogForm.tsx',
  'hooks/useEntitlement.ts',
  'hooks/useWorkoutSession.ts',
  'lib/achievements/achievement-engine.ts',
  'lib/achievements/index.ts',
  'lib/active-week-mutation-service.ts',
  'lib/adaptive-athlete-engine.ts',
]

for (const t of targets) {
  const matches = lines.filter((l) => l.startsWith(t + '('))
  console.log(`\n===== ${t} (${matches.length}) =====`)
  for (const m of matches.slice(0, 80)) console.log(m)
}

console.log('\n===== FIRST 25 DIAGNOSTICS OVERALL =====')
for (const l of lines.slice(0, 25)) console.log(l)
