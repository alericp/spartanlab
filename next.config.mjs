// @ts-nocheck
// This file was auto-created and injected by v0.
// DO NOT MODIFY THIS FILE DIRECTLY.
// EDIT THE USER CONFIG IN ./next.user-config.mjs INSTEAD.

import { fileURLToPath } from 'url'
import path from 'path'

const __v0_turbopack_root = undefined ?? path.dirname(fileURLToPath(import.meta.url))

export default async function v0NextConfig(phase, { defaultConfig }) {
  // [BUILD-FIX] Load the user config defensively. If the file is missing
  // from the deployed commit (the original ERR_MODULE_NOT_FOUND failure
  // mode), fall back to an empty config so the wrapper still produces a
  // valid Next.js configuration instead of crashing the build.
  let userConfigImport = {}
  try {
    const mod = await import('./next.user-config.mjs')
    userConfigImport = mod?.default ?? {}
  } catch {
    userConfigImport = {}
  }

  const resolvedUserConfig =
    (typeof userConfigImport === 'function'
      ? await userConfigImport(phase, { defaultConfig })
      : userConfigImport) || {}

  // [BUILD-FIX] Every nested spread defaults to an empty object so a
  // partial / minimal user config can never produce
  // "Cannot read properties of undefined" at config-load time.
  const userImages = resolvedUserConfig.images || {}
  const userLogging = resolvedUserConfig.logging || {}
  const userTurbopack = resolvedUserConfig.turbopack || {}
  const userExperimental = resolvedUserConfig.experimental || {}
  const userServerActions = userExperimental.serverActions || {}
  const userAllowedDevOrigins = resolvedUserConfig.allowedDevOrigins || []

  return {
    ...resolvedUserConfig,
    distDir: '.next',
    devIndicators: false,
    images: {
      ...userImages,
      unoptimized: process.env.NODE_ENV === 'development',
    },
    logging: {
      ...userLogging,
      fetches: { fullUrl: true, hmrRefreshes: true },
      browserToTerminal: true,
    },
    turbopack: {
      ...userTurbopack,
      root: __v0_turbopack_root,
    },
    experimental: {
      ...userExperimental,
      transitionIndicator: true,
      turbopackFileSystemCacheForDev:
        process.env.TURBOPACK_PERSISTENT_CACHE !== 'false' &&
        process.env.TURBOPACK_PERSISTENT_CACHE !== '0',
      serverActions: {
        ...userServerActions,
        allowedOrigins: [
          ...(userServerActions.allowedOrigins || []),
          '*.vusercontent.net',
        ],
      },
    },
    allowedDevOrigins: [
      ...userAllowedDevOrigins,
      '*.vusercontent.net',
      '*.dev-vm.vusercontent.net',
    ],
  }
}
