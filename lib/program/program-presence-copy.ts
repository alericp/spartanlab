/**
 * Copy for surfaces that mention whether a program exists.
 * A ready claim is allowed only when the program-state authority already
 * reported a usable program. This module does not read storage.
 */

export interface ProgramPresenceCopy {
  claimsProgramReady: boolean
  title: string
  body: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
}

export function dashboardEmptyPresence(
  hasUsableWorkoutProgram: boolean,
  onboardingComplete: boolean,
): ProgramPresenceCopy {
  if (hasUsableWorkoutProgram) {
    return {
      claimsProgramReady: true,
      title: 'Start Your First Workout',
      body: 'Your personalized training program is ready. Begin your first session and SpartanLab will adapt to your performance.',
      primaryLabel: 'Start First Workout',
      primaryHref: '/first-session',
      secondaryLabel: 'view your program first',
      secondaryHref: '/program',
    }
  }

  if (onboardingComplete) {
    return {
      claimsProgramReady: false,
      title: 'No Program Yet',
      body: 'Your answers are saved. Generate your program before the first workout.',
      primaryLabel: 'Generate Program',
      primaryHref: '/onboarding/complete',
      secondaryLabel: 'open Program Builder',
      secondaryHref: '/program',
    }
  }

  return {
    claimsProgramReady: false,
    title: 'No Program Yet',
    body: 'Answer a few training questions and SpartanLab will build your first program.',
    primaryLabel: 'Start Setup',
    primaryHref: '/onboarding',
    secondaryLabel: 'open Program Builder',
    secondaryHref: '/program',
  }
}

export function welcomeProgramCopy(
  hasUsableWorkoutProgram: boolean,
  onboardingComplete: boolean,
): Pick<ProgramPresenceCopy, 'claimsProgramReady' | 'title' | 'body' | 'primaryLabel' | 'primaryHref'> {
  if (hasUsableWorkoutProgram) {
    return {
      claimsProgramReady: true,
      title: 'Your Adaptive Program is Ready',
      body: 'Your first session is personalized for your training. Complete it to activate adaptive adjustments.',
      primaryLabel: 'Start First Session',
      primaryHref: '/first-session',
    }
  }

  if (onboardingComplete) {
    return {
      claimsProgramReady: false,
      title: 'Your training profile is saved',
      body: 'A program has not been created yet. Generate it from your saved answers.',
      primaryLabel: 'Generate Program',
      primaryHref: '/onboarding/complete',
    }
  }

  return {
    claimsProgramReady: false,
    title: 'Finish your training setup',
    body: 'A program has not been created yet. Complete setup to build the first one.',
    primaryLabel: 'Start Setup',
    primaryHref: '/onboarding',
  }
}

export function trialProgramSentence(hasUsableWorkoutProgram: boolean): string {
  if (hasUsableWorkoutProgram) {
    return 'Your training program is now fully personalized.'
  }
  return 'Your program has not been created yet.'
}

/**
 * A recent generation token can skip another build only while a usable
 * program is still stored. The in-memory attempt guard remains separate.
 */
export function shouldSkipCompletedGeneration(input: {
  completed: boolean
  elapsedMs: number
  hasUsableWorkoutProgram: boolean
  windowMs?: number
}): boolean {
  const windowMs = input.windowMs ?? 5 * 60 * 1000
  return input.completed === true
    && Number.isFinite(input.elapsedMs)
    && input.elapsedMs >= 0
    && input.elapsedMs < windowMs
    && input.hasUsableWorkoutProgram === true
}
