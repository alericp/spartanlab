#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = '/vercel/share/v0-project'

console.log('CWD target:', repoRoot)
console.log('package.json:', existsSync(resolve(repoRoot, 'package.json')))
console.log('tsconfig.json:', existsSync(resolve(repoRoot, 'tsconfig.json')))
console.log('node_modules:', existsSync(resolve(repoRoot, 'node_modules')))
console.log('node_modules/typescript:', existsSync(resolve(repoRoot, 'node_modules/typescript')))
console.log('node_modules/.bin/tsc:', existsSync(resolve(repoRoot, 'node_modules/.bin/tsc')))

if (existsSync(resolve(repoRoot, 'node_modules/.bin'))) {
  const bins = readdirSync(resolve(repoRoot, 'node_modules/.bin'))
  console.log('bin entries containing tsc:', bins.filter((b) => b.includes('tsc')))
}

const tscEntry = resolve(repoRoot, 'node_modules/typescript/bin/tsc')
console.log('typescript/bin/tsc:', existsSync(tscEntry))

if (!existsSync(tscEntry)) {
  console.log('--- TypeScript not installed; cannot run tsc ---')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [tscEntry, '--noEmit', '--pretty', 'false'],
  {
    cwd: repoRoot,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  },
)

console.log('exit code:', result.status)
console.log('stderr length:', (result.stderr || '').length)
console.log('stdout length:', (result.stdout || '').length)
if (result.error) console.log('spawn error:', result.error.message)

const combined = (result.stdout || '') + (result.stderr || '')
writeFileSync('/tmp/tsc-output.txt', combined, 'utf-8')

if (combined.length === 0) {
  console.log('--- NO TSC OUTPUT ---')
  process.exit(1)
}

console.log('\n===== RAW HEAD =====')
for (const l of combined.split('\n').slice(0, 5)) console.log(l)

const lines = combined.split('\n').filter((l) => l.includes('error TS'))

console.log('\n===== TOTAL DIAGNOSTICS =====')
console.log(lines.length)

const fileCounts = new Map()
for (const line of lines) {
  const file = line.split('(')[0]
  fileCounts.set(file, (fileCounts.get(file) || 0) + 1)
}
const sorted = [...fileCounts.entries()].sort((a, b) => b[1] - a[1])

console.log('\n===== TOP 25 FILES =====')
for (const [file, count] of sorted.slice(0, 25)) {
  console.log(`${String(count).padStart(5)}  ${file}`)
}

const targets = [
  'lib/program-exercise-selector.ts',
  'lib/canonical-profile-service.ts',
  'lib/adaptive-program-builder.ts',
  'lib/server/authoritative-program-generation.ts',
  'lib/prediction/prediction-service.ts',
]
for (const t of targets) {
  const matches = lines.filter((l) => l.startsWith(t + '('))
  console.log(`\n===== ${t} (${matches.length}) =====`)
  for (const m of matches.slice(0, 80)) console.log(m)
}

console.log('\n===== FIRST 25 DIAGNOSTICS =====')
for (const l of lines.slice(0, 25)) console.log(l)
