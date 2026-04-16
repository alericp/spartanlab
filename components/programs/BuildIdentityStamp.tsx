'use client'

/**
 * BuildIdentityStamp
 *
 * [BUILD-IDENTITY-STAMP] Production-safe build marker.
 *
 * Purpose: lets the user (and support) verify at a glance whether the
 * currently-visible Program page is actually running the newest deploy,
 * or a stale cached bundle / stale service-worker build.
 *
 * Surface: tiny, muted footer line at the bottom of the Program page.
 * - never contains debug/probe text
 * - never affects layout
 * - never fetches anything
 * - safe in SSR and in production
 *
 * Source priority (first non-empty wins):
 *   1. NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA  (set automatically by Vercel)
 *   2. NEXT_PUBLIC_BUILD_SHA              (manual override, optional)
 *   3. 'dev'                              (local dev fallback)
 *
 * The stamp also exposes the full marker via a data-* attribute so
 * support / QA can read it without the user needing to squint.
 */

function resolveBuildSha(): string {
  const fromVercel = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  if (fromVercel && fromVercel.length >= 7) return fromVercel
  const manual = process.env.NEXT_PUBLIC_BUILD_SHA
  if (manual && manual.length >= 7) return manual
  return 'dev'
}

function resolveBuildRef(): string | null {
  const ref = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF
  if (ref && ref.length > 0) return ref
  return null
}

export function BuildIdentityStamp() {
  const sha = resolveBuildSha()
  const short = sha === 'dev' ? 'dev' : sha.slice(0, 7)
  const ref = resolveBuildRef()

  return (
    <div
      className="mt-8 flex items-center justify-center text-[10px] text-[#4A4A4A] font-mono"
      data-build-sha={sha}
      data-build-ref={ref ?? ''}
      aria-label={`Build ${short}`}
    >
      <span>build {short}{ref ? ` · ${ref}` : ''}</span>
    </div>
  )
}
