// AB10 verification: TypeScript no-emit check.
import { spawnSync } from 'node:child_process'

const r = spawnSync(
  'pnpm',
  ['exec', 'tsc', '--noEmit', '--pretty', 'false'],
  {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }
)
const out = (r.stdout || '') + (r.stderr || '')
const lines = out.split('\n')
const tail = lines.slice(-300).join('\n')
process.stdout.write(tail)
process.stdout.write('\n--- exit code: ' + r.status + ' ---\n')
process.exit(r.status === null ? 1 : 0)
