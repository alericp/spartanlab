// [BUILD-UNBLOCK / COMPILER-LEDGER]
// Real, reproducible TypeScript compiler ledger generator. Captures the
// FULL `tsc --noEmit` output to `reports/tsc-full-before.txt` (or
// `tsc-full-after.txt` if the env var REPORT_SUFFIX=after is set) so the
// agent can read genuine compiler evidence instead of guessing from search
// results. Does NOT modify any source files.
import { execSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { cwd } from "node:process"

const suffix = process.env.REPORT_SUFFIX === "after" ? "after" : "before"
const outPath = `reports/tsc-full-${suffix}.txt`

mkdirSync("reports", { recursive: true })

let output = ""
let exitCode = 0
const startedAt = new Date().toISOString()

try {
  output = execSync("pnpm exec tsc --noEmit --pretty false", {
    cwd: cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  })
} catch (err) {
  const e = /** @type {{ stdout?: string; stderr?: string; status?: number; message?: string }} */ (err)
  output = `${e.stdout ?? ""}${e.stderr ?? ""}`
  if (!output && e.message) output = e.message
  exitCode = typeof e.status === "number" ? e.status : 1
}

const finishedAt = new Date().toISOString()
const errorLineCount = output.split("\n").filter((l) => /\: error TS\d+\:/.test(l)).length

const header = [
  `--- tsc run started: ${startedAt}`,
  `--- tsc run finished: ${finishedAt}`,
  `--- exit code: ${exitCode}`,
  `--- error lines (matched ': error TSxxxx:'): ${errorLineCount}`,
  `--- cwd: ${cwd()}`,
  "--- begin tsc output ---",
  "",
].join("\n")

writeFileSync(outPath, header + output + "\n--- end tsc output ---\n")
console.log(`tsc done. exit=${exitCode}, errorLines=${errorLineCount}, saved to ${outPath}`)
