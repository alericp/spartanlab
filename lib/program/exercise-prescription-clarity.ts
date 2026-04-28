// =============================================================================
// [STEP 4 OF 19 — EXERCISE PRESCRIPTION CLARITY]
//
// Display-time clarity layer for the most-impactful skill rows on the Program
// page. This module does NOT mutate program truth — it only resolves a small
// overlay (ROM/depth standard, primary purpose, and an HSPU/pike progression
// sanity hint) keyed off the exercise name + numeric prescription.
//
// Why this lives display-side, not in the builder:
//   * The builder writes sets/reps/RPE/rest from authoritative truth. Adding
//     ROM/depth/purpose to the builder requires a synchronized edit across
//     adaptive-program-builder.ts, every progression resolver, and every
//     recomposition path — out of scope and high-risk for one corridor.
//   * The Program page already renders the row; this overlay surfaces the
//     missing coach-grade context the user is asking for, without changing
//     what the builder emits or what Start Workout consumes today.
//
// HSPU/pike sanity:
//   The user explicitly flagged that handstand-push-up family rows must not
//   prescribe high-rep full HSPU ranges unless ability supports them. This
//   resolver classifies the row's HSPU family, then returns a `repRangeHint`
//   string ONLY when the prescribed reps are not realistic for that family.
//   The hint is displayed inline as a soft amber note; the prescription
//   numbers themselves are unchanged so we never silently override what the
//   builder emitted.
// =============================================================================

export type HspuFamilyClass =
  | 'wall_handstand_hold'
  | 'pike_pushup'
  | 'elevated_pike_pushup'
  | 'deep_pike_pushup'
  | 'wall_hspu_negative'
  | 'partial_wall_hspu'
  | 'full_wall_hspu'
  | 'deficit_wall_hspu'
  | 'freestanding_hspu'
  | null

export interface ExercisePrescriptionClarity {
  /** ROM / depth / position standard the athlete should see on the row. */
  romStandard: string | null
  /** Primary purpose / carryover for this row. One short sentence fragment. */
  purposeText: string | null
  /** HSPU/pike family classification, when applicable. */
  hspuFamilyClass: HspuFamilyClass
  /** Soft amber hint shown when the prescription's reps appear unrealistic
   *  for the resolved HSPU/pike family. Null otherwise. */
  repRangeHint: string | null
  /** Source verdict — useful for diagnostics. */
  source: 'matched' | 'no_match'
}

const EMPTY: ExercisePrescriptionClarity = {
  romStandard: null,
  purposeText: null,
  hspuFamilyClass: null,
  repRangeHint: null,
  source: 'no_match',
}

const norm = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Parse a reps string like "8-15", "5", "10 reps", "6s hold" into a numeric
// upper bound (or null). Used only for the HSPU sanity check.
function parseRepsUpperBound(repsRaw: string | number | null | undefined): number | null {
  if (repsRaw === null || repsRaw === undefined) return null
  const s = String(repsRaw).toLowerCase()
  // hold-based prescriptions are not rep-based — skip
  if (/\bs\b|\bsec|hold/.test(s)) return null
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) return Number(range[2])
  const single = s.match(/(\d+)/)
  return single ? Number(single[1]) : null
}

// =============================================================================
// HSPU/PIKE FAMILY CLASSIFIER
// =============================================================================
function classifyHspuFamily(name: string): HspuFamilyClass {
  const n = norm(name)
  if (!n) return null

  // Negatives must match before generic wall HSPU
  if (/wall (handstand )?(push ?up|hspu) negative/.test(n) || /hspu negative/.test(n)) {
    return 'wall_hspu_negative'
  }
  if (/partial (wall )?(handstand )?(push ?up|hspu)/.test(n) || /(half|top half) (wall )?hspu/.test(n)) {
    return 'partial_wall_hspu'
  }
  if (/deficit (wall )?(handstand )?(push ?up|hspu)|deep (wall )?(handstand )?(push ?up|hspu)/.test(n)) {
    return 'deficit_wall_hspu'
  }
  if (/freestanding (handstand )?(push ?up|hspu)/.test(n)) {
    return 'freestanding_hspu'
  }
  if (/wall (handstand )?(push ?up|hspu)/.test(n) || /\bhspu\b/.test(n)) {
    return 'full_wall_hspu'
  }
  if (/deep pike/.test(n) || /\bdeficit pike/.test(n)) {
    return 'deep_pike_pushup'
  }
  if (/elevated pike|feet elevated pike|box pike|bench pike|couch pike/.test(n)) {
    return 'elevated_pike_pushup'
  }
  if (/pike push ?up/.test(n)) {
    return 'pike_pushup'
  }
  if (/wall (handstand )?hold|handstand hold|back to wall hold/.test(n)) {
    return 'wall_handstand_hold'
  }
  return null
}

// =============================================================================
// HSPU SANITY: realistic upper-bound reps per family
// =============================================================================
function hspuRepRangeHint(
  family: HspuFamilyClass,
  repsUpper: number | null,
): string | null {
  if (!family || repsUpper === null) return null
  switch (family) {
    case 'wall_handstand_hold':
      // Hold-based — no rep prescription should appear
      if (repsUpper >= 5) {
        return 'Wall handstand is a hold — use seconds, not reps. Conservative: 20–40s.'
      }
      return null
    case 'pike_pushup':
      // Beginner-to-intermediate pushing: 8–15 is realistic
      if (repsUpper > 20) return 'Pike push-up upper-bound trimmed: 8–15 is the realistic range.'
      return null
    case 'elevated_pike_pushup':
      // Stronger angle — keep moderate
      if (repsUpper > 15) return 'Elevated pike target: 6–12. Lower than basic pike, more controlled.'
      return null
    case 'deep_pike_pushup':
      if (repsUpper > 12) return 'Deep pike target: 4–8. Greater ROM = lower reps and higher intensity.'
      return null
    case 'wall_hspu_negative':
      // Eccentric-only strength — low reps
      if (repsUpper > 8) return 'HSPU negative target: 3–6 controlled descents (eccentric-only).'
      return null
    case 'partial_wall_hspu':
      if (repsUpper > 10) return 'Partial-ROM wall HSPU target: 4–8 with explicit depth standard.'
      return null
    case 'full_wall_hspu':
      // Advanced strength — flag generic 8–15 / 7–15
      if (repsUpper > 8) {
        return 'Full wall HSPU is advanced strength. Conservative target: 3–6 reps; 7–15 only if capacity is proven.'
      }
      return null
    case 'deficit_wall_hspu':
      if (repsUpper > 6) return 'Deficit/deep HSPU target: 2–5. Very advanced — use clear depth standard.'
      return null
    case 'freestanding_hspu':
      if (repsUpper > 6) return 'Freestanding HSPU target: 2–5. Skill + strength — quality over volume.'
      return null
    default:
      return null
  }
}

function hspuFamilyROM(family: HspuFamilyClass): string | null {
  switch (family) {
    case 'wall_handstand_hold':
      return 'Stacked wrists/shoulders/hips, ribs down, no banana back.'
    case 'pike_pushup':
      return 'Hips high, elbows track over wrists, head between shoulders at depth.'
    case 'elevated_pike_pushup':
      return 'Feet elevated; aim for vertical pressing angle. Crown of head past hands at depth.'
    case 'deep_pike_pushup':
      return 'Greater ROM than basic pike — head sinks below hand line with control.'
    case 'wall_hspu_negative':
      return 'Eccentric only — 3–5s descent, scap control, no collapse at depth.'
    case 'partial_wall_hspu':
      return 'Defined depth target (e.g. yoga block / 2 ab mats). No grinder reps.'
    case 'full_wall_hspu':
      return 'Crown of head touches floor; full lockout at top.'
    case 'deficit_wall_hspu':
      return 'Hands elevated (parallettes or blocks); head below hand line at depth.'
    case 'freestanding_hspu':
      return 'No wall; balance held throughout. Quality over volume.'
    default:
      return null
  }
}

function hspuFamilyPurpose(family: HspuFamilyClass): string | null {
  switch (family) {
    case 'wall_handstand_hold':
      return 'Handstand line + HSPU prerequisite — position before strength.'
    case 'pike_pushup':
    case 'elevated_pike_pushup':
    case 'deep_pike_pushup':
      return 'Vertical pressing strength toward HSPU.'
    case 'wall_hspu_negative':
      return 'Eccentric strength build for full HSPU.'
    case 'partial_wall_hspu':
    case 'full_wall_hspu':
    case 'deficit_wall_hspu':
      return 'Direct HSPU strength.'
    case 'freestanding_hspu':
      return 'Freestanding HSPU skill + strength.'
    default:
      return null
  }
}

// =============================================================================
// NON-HSPU SKILL ROW MAP (the user's explicit call-out list)
// =============================================================================
interface SkillEntry {
  match: RegExp
  romStandard: string
  purposeText: string
}

const SKILL_TABLE: SkillEntry[] = [
  {
    match: /planche lean/,
    romStandard: 'Shoulders forward of wrists, elbows locked, scap protracted.',
    purposeText: 'Primary planche straight-arm skill exposure.',
  },
  {
    match: /tuck front lever( hold)?|advanced tuck front lever|front lever tuck/,
    romStandard: 'Hips tucked, scap depressed, no elbow bend.',
    purposeText: 'Front lever technical exposure.',
  },
  {
    match: /skin the cat/,
    romStandard: 'Shoulder-controlled rotation; do not force end-range — train range, not pain.',
    purposeText: 'Shoulder extension capacity for back lever / muscle-up.',
  },
  {
    match: /archer pull ?ups?/,
    romStandard: 'Controlled side bias, full scap pull, no twisting at top.',
    purposeText: 'One-arm pull-up / front lever strength support.',
  },
  {
    match: /chest ?to ?bar pull ?ups?|c ?2 ?b/,
    romStandard: 'Lower chest contacts bar; no kip, full hang at bottom.',
    purposeText: 'Vertical pulling depth for muscle-up transition.',
  },
  {
    match: /explosive pull ?ups?|high pull ?ups?/,
    romStandard: 'Drive bar to lower chest or higher; quick, clean reps.',
    purposeText: 'Pulling power for muscle-up.',
  },
  {
    match: /weighted pull ?ups?/,
    romStandard: 'Full hang start, chin clearly over bar, no kip.',
    purposeText: 'Vertical pulling strength foundation. Add load only if all sets stable at RPE ≤ 8.',
  },
  {
    match: /weighted dips?/,
    romStandard: 'Shoulders below elbows at depth; no flare at lockout.',
    purposeText: 'Vertical pressing strength foundation. RPE-based load — no grinder reps.',
  },
  {
    match: /muscle ?up/,
    romStandard: 'Full hang; transition without chicken-wing; clean lockout.',
    purposeText: 'Direct muscle-up skill + strength.',
  },
  {
    match: /(advanced )?tuck back lever|back lever( hold)?/,
    romStandard: 'Shoulder extension capacity, ribs in, body line per progression.',
    purposeText: 'Direct shoulder-extension exposure for back lever.',
  },
  {
    match: /dragon flag/,
    romStandard: 'Hip extension + body line; lower-back stays glued to bench at top.',
    purposeText: 'Anterior chain core capacity.',
  },
  {
    match: /\bchin ?ups?\b/,
    romStandard: 'Full hang; chin over bar; no kip.',
    purposeText: 'Vertical pulling strength (supinated).',
  },
  {
    match: /one ?arm (pull ?up|chin ?up)/,
    romStandard: 'Full hang on the working arm; minimal twist; no kip.',
    purposeText: 'One-arm pulling — direct skill + strength.',
  },
  {
    match: /pseudo planche push ?up/,
    romStandard: 'Hands by hips, shoulders far forward of wrists, scap protracted.',
    purposeText: 'Planche pressing strength carryover.',
  },
  {
    match: /tuck planche|advanced tuck planche|straddle planche/,
    romStandard: 'Shoulders fully forward of wrists, scap protracted, hips/legs per progression.',
    purposeText: 'Direct planche skill exposure.',
  },
  {
    match: /l ?sit/,
    romStandard: 'Hips at or above hand line; legs locked; scap depressed.',
    purposeText: 'Compression + scap-depression strength.',
  },
  {
    match: /pistol squat/,
    romStandard: 'Heel down, knee tracks toes, depth at or below parallel.',
    purposeText: 'Single-leg lower-body strength.',
  },
]

// =============================================================================
// PUBLIC RESOLVER
// =============================================================================
export function resolveExercisePrescriptionClarity(input: {
  exerciseName: string
  reps?: string | number | null
  // (sets/RPE not used today; reserved for future ranges)
}): ExercisePrescriptionClarity {
  const name = (input.exerciseName || '').trim()
  if (!name) return EMPTY

  // 1. HSPU/pike family classification (priority — user explicitly called out)
  const hspuFamily = classifyHspuFamily(name)
  if (hspuFamily) {
    const repsUpper = parseRepsUpperBound(input.reps ?? null)
    return {
      romStandard: hspuFamilyROM(hspuFamily),
      purposeText: hspuFamilyPurpose(hspuFamily),
      hspuFamilyClass: hspuFamily,
      repRangeHint: hspuRepRangeHint(hspuFamily, repsUpper),
      source: 'matched',
    }
  }

  // 2. Non-HSPU skill rows
  const n = norm(name)
  for (const entry of SKILL_TABLE) {
    if (entry.match.test(n)) {
      return {
        romStandard: entry.romStandard,
        purposeText: entry.purposeText,
        hspuFamilyClass: null,
        repRangeHint: null,
        source: 'matched',
      }
    }
  }

  return EMPTY
}
