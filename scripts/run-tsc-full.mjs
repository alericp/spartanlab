#!/usr/bin/env node
// [DIAGNOSTIC] Run a full TypeScript type-check and capture output.
// Used by the build-unblock workflow to produce a fresh compiler proof.

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')
const outDir = resolve(repoRoot, 'tsc-reports')
mkdirSync(outDir, { recursive: true })
const outPath = resolve(outDir, 'TSC_FULL_OUTPUT.txt')

const result = spawnSync('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false'], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
})

const out = (result.stdout || '') + (result.stderr || '')
writeFileSync(outPath, out, 'utf8')

const lines = out.split(/\r?\n/)
const errorLineRe = /^([^()]+?)\((\d+),(\d+)\): error TS\d+:/
const errorLines = lines.filter((l) => errorLineRe.test(l))
const fileCounts = new Map()
for (const l of errorLines) {
  const m = l.match(errorLineRe)
  if (!m) continue
  fileCounts.set(m[1], (fileCounts.get(m[1]) || 0) + 1)
}

console.log('=== TSC SUMMARY ===')
console.log(`exit code:          ${result.status}`)
console.log(`total output lines: ${lines.length}`)
console.log(`error lines:        ${errorLines.length}`)
console.log(`files with errors:  ${fileCounts.size}`)

console.log('\n=== TOP 30 ERROR FILES ===')
const sorted = [...fileCounts.entries()].sort((a, b) => b[1] - a[1])
for (const [f, c] of sorted.slice(0, 30)) {
  console.log(`  ${String(c).padStart(5)}  ${f}`)
}

console.log('\n=== FIRST 5 ERRORS ===')
for (const l of errorLines.slice(0, 5)) console.log(l)

console.log('\n=== TARGET FILE COUNTS ===')
const targets = [
  'components/workout/StreamlinedWorkoutSession.tsx',
  'components/workout/WhyThisWorkout.tsx',
  'components/workout/WorkoutSessionSummary.tsx',
  'hooks/useWorkoutSession.ts',
  'lib/adaptive-program-builder.ts',
  'lib/program-exercise-selector.ts',
  'lib/server/authoritative-program-generation.ts',
  'lib/canonical-profile-service.ts',
  'lib/weak-point-engine.ts',
  'lib/prediction/prediction-service.ts',
  'lib/program-history-versioning.ts',
  'lib/unified-coaching-engine.ts',
  'lib/weak-point-detection.ts',
  'lib/program-state.ts',
  'lib/doctrine/source-batches/batch-02-uploaded-pdf-doctrine.ts',
  'lib/doctrine/source-batches/batch-03-uploaded-pdf-doctrine.ts',
  'lib/doctrine-runtime-contract.ts',
  'lib/advanced-skill-graphs.ts',
  'lib/performance-envelope-service.ts',
]
for (const t of targets) {
  console.log(`  ${(fileCounts.get(t) || 0).toString().padStart(5)}  ${t}`)
}
