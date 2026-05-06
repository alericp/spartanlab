#!/usr/bin/env bash
# AB10 verification: TypeScript no-emit check.
set -e
cd /vercel/share/v0-project
pnpm exec tsc --noEmit --pretty false 2>&1 | tail -200
