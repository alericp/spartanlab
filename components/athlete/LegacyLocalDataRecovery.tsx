'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { claimLegacyLocalData, describeLegacyRecovery } from '@/lib/athlete-local-scope'

/**
 * Asks the signed-in athlete before copying ownerless device data onto
 * their account. The prompt shows counts only. Dismissing hides it for
 * this browser tab and leaves the original records where they are.
 */
export function LegacyLocalDataRecovery() {
  const { user, isLoaded } = useUser()
  const [dismissed, setDismissed] = useState(false)
  const [claimed, setClaimed] = useState(false)
  if (!isLoaded || !user?.id || dismissed || claimed) return null

  const counts = describeLegacyRecovery()
  const total = counts.workouts + counts.profiles + counts.programs
  if (total === 0) return null

  const parts = [
    counts.workouts > 0 ? `${counts.workouts} saved workout record${counts.workouts === 1 ? '' : 's'}` : '',
    counts.profiles > 0 ? `${counts.profiles} profile record${counts.profiles === 1 ? '' : 's'}` : '',
    counts.programs > 0 ? `${counts.programs} program record${counts.programs === 1 ? '' : 's'}` : '',
  ].filter(Boolean)

  return (
    <div className="border-b border-[#2B313A] bg-[#141A22] px-4 py-3 text-sm text-[#E6E8EB]">
      <p>
        This browser has {parts.join(', ')} that {total === 1 ? 'is' : 'are'} not linked to an account.
        Add {total === 1 ? 'it' : 'them'} to the account you are signed in to only if {total === 1 ? 'it is' : 'they are'} yours.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded bg-[#F5C16C] px-3 py-1.5 text-sm font-medium text-[#14110B]"
          onClick={() => {
            if (claimLegacyLocalData()) setClaimed(true)
          }}
        >
          Add to this account
        </button>
        <button
          type="button"
          className="rounded border border-[#2B313A] px-3 py-1.5 text-sm text-[#C5CAD1]"
          onClick={() => setDismissed(true)}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
