/**
 * =============================================================================
 * [PHASE 4N] TRAINING INTENT VECTOR
 *
 * Single canonical reading of the user's full onboarding/profile truth into a
 * multi-intent vector that the doctrine application corridor and weekly
 * method budget plan both consume.
 *
 * REPLACES the narrow `deriveProfileIntent()` in
 * `lib/program/doctrine-application-corridor.ts` which read only 5 fields
 * and collapsed `selectedSkills.length >= 2` into a global `skillPriority`
 * blunt block on top sets / drop sets / rest-pause / density.
 *
 * The vector is ADDITIVE — the legacy `deriveProfileIntent()` still exists
 * so any unrelated path that imports it keeps working. Phase 4N consumers
 * read the vector instead.
 *
 * Multi-intent profiles are first-class: a user can be skill-priority AND
 * strength-priority AND hypertrophy-support AND endurance-support at the
 * same time. Skill priority is row-protective only (it does NOT erase
 * non-skill rows from method eligibility).
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// PUBLIC TYPES
// ---------------------------------------------------------------------------

/**
 * Permissive shape — the vector reads everything available on the profile
 * snapshot OR the canonical programming profile, with safe fall-back.
 * Every field is optional.
 */
export interface TrainingIntentSourceLike {
  // Goals
  primaryGoal?: string | null
  secondaryGoal?: string | null
  goalCategory?: string | null
  goalCategories?: string[] | null
  trainingPathType?: string | null
  primaryTrainingOutcome?: string | null

  // Selections
  selectedSkills?: string[] | null
  selectedStrength?: string[] | null
  selectedFlexibility?: string[] | null
  selectedTrainingStyles?: string[] | null
  selectedTrainingMethods?: string[] | null
  trainingMethodPreferences?: Array<string | { id?: string; key?: string }> | null

  // Style / session shape
  sessionStylePreference?: string | null
  trainingStyle?: string | null
  sessionLengthMinutes?: number | null
  sessionDurationMode?: string | null
  trainingDaysPerWeek?: number | null
  scheduleMode?: string | null
  adaptiveWorkloadEnabled?: boolean | null

  // Experience
  experienceLevel?: string | null
  trainingExperience?: string | null

  // Equipment
  equipmentAvailable?: string[] | null

  // Safety
  jointCautions?: string[] | null
  weakestArea?: string | null
  primaryLimitation?: string | null

  // Strength benchmarks (advanced-athlete signals)
  pullUpMax?: string | null
  dipMax?: string | null
  pushUpMax?: string | null
  wallHSPUReps?: string | null
  weightedPullUp?: { addedWeight?: number | null; reps?: number | null } | null
  weightedDip?: { addedWeight?: number | null; reps?: number | null } | null

  // Skill benchmarks (tendon protection signals)
  frontLeverProgression?: string | null
  plancheProgression?: string | null
  muscleUpReadiness?: string | null
  hspuProgression?: string | null

  // Recovery
  recoveryQuality?: string | null
}

/**
 * Each intent dimension is a 0–1 score.
 *
 *  0.0 — absent
 *  0.25 — weak hint
 *  0.5 — moderate (one direct signal)
 *  0.6 — explicit-method-preference floor (Phase AA1 — user picked this method
 *        in onboarding/settings; budget plan should treat as MAY_APPLY rather
 *        than NOT_NEEDED, but doctrine still gates safety + targets)
 *  0.75 — strong (multiple direct signals)
 *  1.0 — explicit primary target
 *
 * Multi-intent profiles can have several dimensions at 0.5+ simultaneously.
 */
export interface TrainingIntentVector {
  version: 'phase-aa1' | 'phase-4n'

  strengthIntent: number
  hypertrophyIntent: number
  skillIntent: number
  enduranceIntent: number
  densityIntent: number
  mobilityIntent: number
  flexibilityIntent: number

  recoveryProtectionIntent: number
  tendonProtectionIntent: number

  advancedAthleteSignal: number
  beginnerProtectionSignal: number

  weeklyFrequencySignal: number | null
  sessionDurationSignal: number | null

  selectedSkills: string[]
  selectedTrainingStyles: string[]
  selectedTrainingMethods: string[]
  equipmentSignals: string[]

  /**
   * [PHASE AA1] Canonical, normalized list of method preferences the user
   * actually opted into via onboarding/settings (`trainingMethodPreferences`)
   * OR via the legacy `selectedTrainingMethods` blob. Vocabulary matches the
   * canonical method preference union — `straight_sets`, `supersets`,
   * `circuits`, `density_blocks`, `cluster_sets`, `top_sets`, `drop_sets`,
   * `rest_pause`, `ladder_sets`. Empty when the profile carries no explicit
   * preference and the inferred default never ran.
   *
   * This is the ONE field downstream code should read to answer
   * "did the user explicitly pick this method?" — it tolerates both source
   * field names and string vs object shapes.
   */
  explicitMethodPreferences: string[]

  /**
   * [PHASE AA1] Per-method intent boost the explicit preferences applied. One
   * row per canonical method id with the floor we pushed the corresponding
   * intent to. Used by the weekly method budget plan to distinguish
   * "doctrine-earned" from "user-preference-earned" verdicts and by the
   * weekly materialization plan to render the source on the proof surface.
   */
  explicitMethodPreferenceBoosts: Array<{
    method: string
    intentTouched: 'densityIntent' | 'enduranceIntent' | 'hypertrophyIntent' | 'strengthIntent' | 'none'
    floor: number
  }>

  sourceFieldsUsed: string[]
  sourceFieldsMissing: string[]
  confidence: 'low' | 'partial' | 'usable' | 'strong'
  warnings: string[]
}

// ---------------------------------------------------------------------------
// TOKEN BANKS — explicit, narrow, doctrine-aligned
// ---------------------------------------------------------------------------

const STRENGTH_TOKENS = [
  'strength',
  'weighted_strength',
  'weighted strength',
  'max_strength',
  'maximal_strength',
  'powerlifting',
  'weighted_calisthenics',
  'weighted calisthenics',
  'weighted_pull',
  'weighted_dip',
] as const

const HYPERTROPHY_TOKENS = [
  'hypertrophy',
  'muscle',
  'muscle_building',
  'aesthetic',
  'physique',
  'mass',
  'size',
  'bodybuilding',
  'arms',
  'chest',
  'back',
] as const

const SKILL_TOKENS = [
  'skill',
  'planche',
  'lever',
  'front_lever',
  'back_lever',
  'handstand',
  'iron cross',
  'iron_cross',
  'maltese',
  'one_arm',
  'one arm',
  'muscle_up',
  'muscle-up',
  'manna',
  'victorian',
  'one_arm_pull',
  'hspu',
  'dragon flag',
  'dragon_flag',
] as const

const ENDURANCE_TOKENS = [
  'endurance',
  'strength_endurance',
  'strength endurance',
  'muscular_endurance',
  'work_capacity',
  'work capacity',
  'metcon',
  'stamina',
  'conditioning',
  'cardio',
  'military',
  'gpp',
  'general_fitness',
  'general fitness',
  'max_reps',
] as const

const DENSITY_TOKENS = [
  'density',
  'density_block',
  'density block',
  'time_efficient',
  'time efficient',
  'compressed',
  'short_session',
  'short session',
  'circuit',
  'metcon',
] as const

const MOBILITY_TOKENS = ['mobility', 'mobilize', 'movement_quality'] as const
const FLEXIBILITY_TOKENS = ['flexibility', 'splits', 'pancake', 'pike', 'bridge', 'splits_'] as const

const TENDON_SENSITIVE_SKILLS = [
  'planche',
  'front_lever',
  'front lever',
  'back_lever',
  'back lever',
  'iron_cross',
  'iron cross',
  'maltese',
  'victorian',
  'one_arm',
  'one arm',
  'straight_arm',
  'straight arm',
  'manna',
] as const

const RECOVERY_FLAG_TOKENS = ['poor', 'low', 'fatigued', 'tired', 'stressed', 'underrecovered'] as const

// ---------------------------------------------------------------------------
// PUBLIC ENTRY
// ---------------------------------------------------------------------------

/**
 * Reads the full available profile truth and produces a multi-intent vector.
 *
 * Safe to call with `null` / `undefined` / partial profiles — confidence is
 * downgraded accordingly and `sourceFieldsMissing` enumerates what was
 * unavailable.
 */
export function buildTrainingIntentVector(
  profile: TrainingIntentSourceLike | null | undefined
): TrainingIntentVector {
  const used: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  function recordUsed(field: string) {
    if (!used.includes(field)) used.push(field)
  }
  function recordMissing(field: string) {
    if (!missing.includes(field)) missing.push(field)
  }

  // -------------------------------------------------------------------------
  // 1. Build a normalized search blob from every text-bearing goal field.
  // -------------------------------------------------------------------------

  const primary = String(profile?.primaryGoal ?? '').toLowerCase()
  const secondary = String(profile?.secondaryGoal ?? '').toLowerCase()
  const goalCategory = String(profile?.goalCategory ?? '').toLowerCase()
  const goalCategories = (profile?.goalCategories ?? []).map(g => String(g).toLowerCase())
  const trainingPath = String(profile?.trainingPathType ?? '').toLowerCase()
  const primaryOutcome = String(profile?.primaryTrainingOutcome ?? '').toLowerCase()
  const styles = (profile?.selectedTrainingStyles ?? []).map(s => String(s).toLowerCase())
  const stylePref = String(profile?.sessionStylePreference ?? '').toLowerCase()
  const trainingStyle = String(profile?.trainingStyle ?? '').toLowerCase()
  const skills = (profile?.selectedSkills ?? []).map(s => String(s).toLowerCase())
  const selectedStrength = (profile?.selectedStrength ?? []).map(s => String(s).toLowerCase())
  const selectedFlexibility = (profile?.selectedFlexibility ?? []).map(s => String(s).toLowerCase())
  const trainingMethods = (profile?.selectedTrainingMethods ?? []).map(s => String(s).toLowerCase())

  // ---------------------------------------------------------------------------
  // [PHASE AA1 OF 3] EXPLICIT METHOD PREFERENCE READER
  //
  // The pre-AA1 vector declared `trainingMethodPreferences` in its input type
  // but never actually read it. As a result the canonical
  // `program.profileSnapshot.trainingMethodPreferences` (which IS populated
  // from `canonicalProfile.trainingMethodPreferences`) was a dead-letter
  // field for intent scoring. Downstream effect: a hybrid skill+strength
  // user with `['straight_sets', 'supersets', 'circuits', 'density_blocks']`
  // got `densityIntent = 0` and `enduranceIntent = 0`, the budget plan
  // returned `NOT_NEEDED` for circuit / density_block, the structural
  // materialization corridor wrote `not_needed` entries, and the user
  // reasonably complained: "I picked density blocks, where are they?"
  //
  // This block normalizes BOTH `trainingMethodPreferences` (canonical) AND
  // `selectedTrainingMethods` (legacy) into one canonical method id list,
  // then applies a 0.6 floor to the corresponding intent. 0.6 is a deliberate
  // choice: it clears the budget plan's 0.5 NOT_NEEDED threshold so the
  // method becomes MAY_APPLY, but stays below 0.75 so doctrine-earned
  // SHOULD_APPLY (which requires multiple direct signals) is not impersonated
  // by a single checkbox click. Safety gates (`BLOCKED_BY_SAFETY`,
  // `NO_SAFE_TARGET`) still take priority — explicit preference cannot
  // override a tendon-protection or no-safe-target verdict.
  // ---------------------------------------------------------------------------
  const EXPLICIT_PREF_FLOOR = 0.6
  const rawMethodPrefs = profile?.trainingMethodPreferences ?? []
  const normalizedExplicitPrefs: string[] = []
  for (const entry of rawMethodPrefs) {
    if (entry == null) continue
    let id: string
    if (typeof entry === 'string') id = entry.toLowerCase()
    else if (typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string') id = entry.id.toLowerCase()
    else if (typeof entry === 'object' && 'key' in entry && typeof entry.key === 'string') id = entry.key.toLowerCase()
    else continue
    // Normalize singular ↔ plural variants the codebase uses interchangeably.
    if (id === 'top_set') id = 'top_sets'
    if (id === 'drop_set') id = 'drop_sets'
    if (id === 'density_block') id = 'density_blocks'
    if (id === 'circuit') id = 'circuits'
    if (id === 'superset') id = 'supersets'
    if (id === 'cluster_set' || id === 'cluster') id = 'cluster_sets'
    if (id === 'ladder_set') id = 'ladder_sets'
    if (!normalizedExplicitPrefs.includes(id)) normalizedExplicitPrefs.push(id)
  }
  // Also fold in any tokens from `selectedTrainingMethods` (legacy text blob)
  // that match a canonical method id directly.
  const CANONICAL_METHODS = [
    'straight_sets', 'supersets', 'circuits', 'density_blocks',
    'cluster_sets', 'top_sets', 'drop_sets', 'rest_pause', 'ladder_sets',
  ]
  for (const tok of trainingMethods) {
    if (CANONICAL_METHODS.includes(tok) && !normalizedExplicitPrefs.includes(tok)) {
      normalizedExplicitPrefs.push(tok)
    }
  }

  if (normalizedExplicitPrefs.length > 0) {
    recordUsed('trainingMethodPreferences')
  } else if (rawMethodPrefs.length === 0) {
    recordMissing('trainingMethodPreferences')
  }

  // Build the per-method boost trace BEFORE applying floors so we can record
  // exactly which intent each preference touched.
  const explicitMethodPreferenceBoosts: TrainingIntentVector['explicitMethodPreferenceBoosts'] = []
  for (const prefId of normalizedExplicitPrefs) {
    let intentTouched: TrainingIntentVector['explicitMethodPreferenceBoosts'][number]['intentTouched'] = 'none'
    if (prefId === 'circuits' || prefId === 'density_blocks') intentTouched = 'densityIntent'
    else if (prefId === 'rest_pause') intentTouched = 'hypertrophyIntent'
    else if (prefId === 'drop_sets') intentTouched = 'hypertrophyIntent'
    else if (prefId === 'top_sets' || prefId === 'cluster_sets') intentTouched = 'strengthIntent'
    else if (prefId === 'ladder_sets') intentTouched = 'enduranceIntent'
    // supersets and straight_sets do not boost any intent — supersets are
    // earned by density/hypertrophy/short-session signals already and
    // straight_sets is the safe baseline.
    explicitMethodPreferenceBoosts.push({ method: prefId, intentTouched, floor: EXPLICIT_PREF_FLOOR })
  }

  if (primary) recordUsed('primaryGoal'); else recordMissing('primaryGoal')
  if (secondary) recordUsed('secondaryGoal'); else recordMissing('secondaryGoal')
  if (goalCategory) recordUsed('goalCategory'); else recordMissing('goalCategory')
  if (goalCategories.length) recordUsed('goalCategories'); else recordMissing('goalCategories')
  if (trainingPath) recordUsed('trainingPathType'); else recordMissing('trainingPathType')
  if (primaryOutcome) recordUsed('primaryTrainingOutcome'); else recordMissing('primaryTrainingOutcome')
  if (styles.length) recordUsed('selectedTrainingStyles'); else recordMissing('selectedTrainingStyles')
  if (stylePref) recordUsed('sessionStylePreference'); else recordMissing('sessionStylePreference')
  if (trainingStyle) recordUsed('trainingStyle'); else recordMissing('trainingStyle')
  if (skills.length) recordUsed('selectedSkills'); else recordMissing('selectedSkills')
  if (selectedStrength.length) recordUsed('selectedStrength'); else recordMissing('selectedStrength')
  if (selectedFlexibility.length) recordUsed('selectedFlexibility'); else recordMissing('selectedFlexibility')
  if (trainingMethods.length) recordUsed('selectedTrainingMethods'); else recordMissing('selectedTrainingMethods')

  const goalBlob = [
    primary,
    secondary,
    goalCategory,
    goalCategories.join(' '),
    trainingPath,
    primaryOutcome,
    styles.join(' '),
    stylePref,
    trainingStyle,
    selectedStrength.join(' '),
    selectedFlexibility.join(' '),
    trainingMethods.join(' '),
  ].join(' ')

  // -------------------------------------------------------------------------
  // 2. Per-dimension scoring — count distinct signal sources and clamp.
  // -------------------------------------------------------------------------

  function score(tokenBank: readonly string[], extraBlobs: string[] = []): number {
    let hits = 0
    const haystacks = [goalBlob, ...extraBlobs]
    for (const h of haystacks) {
      for (const t of tokenBank) {
        if (h.includes(t)) {
          hits += 1
          break // one hit per haystack max
        }
      }
    }
    if (hits === 0) return 0
    if (hits === 1) return 0.5
    if (hits === 2) return 0.75
    return 1.0
  }

  // Strength — primary + selectedStrength + weighted_calisthenics path are all valid
  let strengthIntent = score(STRENGTH_TOKENS, [selectedStrength.join(' '), trainingPath, primaryOutcome])
  if (selectedStrength.length > 0) strengthIntent = Math.max(strengthIntent, 0.75)
  if (trainingPath.includes('hybrid') && skills.length > 0) strengthIntent = Math.max(strengthIntent, 0.5)
  if (primary === 'strength' || primaryOutcome === 'strength') strengthIntent = 1.0

  // Hypertrophy
  let hypertrophyIntent = score(HYPERTROPHY_TOKENS)
  if (primary === 'hypertrophy' || goalCategory === 'hypertrophy') hypertrophyIntent = 1.0

  // Skill — based on goal blob OR selected skills (presence, not count)
  let skillIntent = score(SKILL_TOKENS, [skills.join(' ')])
  if (skills.length > 0) skillIntent = Math.max(skillIntent, 0.75)
  if (skills.length >= 2) skillIntent = Math.max(skillIntent, 1.0)
  if (primaryOutcome === 'skills' || trainingPath === 'skill_progression') skillIntent = 1.0

  // Endurance
  let enduranceIntent = score(ENDURANCE_TOKENS)
  if (primary === 'endurance' || primaryOutcome === 'endurance' || primaryOutcome === 'max_reps' || primaryOutcome === 'military') {
    enduranceIntent = Math.max(enduranceIntent, 1.0)
  }
  if (trainingPath === 'strength_endurance') enduranceIntent = Math.max(enduranceIntent, 0.75)

  // Density — explicit density signals OR very short session preference
  let densityIntent = score(DENSITY_TOKENS)
  const sessionLength = typeof profile?.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : null
  if (sessionLength !== null && sessionLength <= 30) {
    densityIntent = Math.max(densityIntent, 0.75)
    recordUsed('sessionLengthMinutes')
  } else if (sessionLength !== null && sessionLength <= 45) {
    densityIntent = Math.max(densityIntent, 0.5)
    recordUsed('sessionLengthMinutes')
  } else if (sessionLength === null) {
    recordMissing('sessionLengthMinutes')
  } else {
    recordUsed('sessionLengthMinutes')
  }
  if (stylePref.includes('shorter') || stylePref.includes('time_efficient') || stylePref.includes('compressed')) {
    densityIntent = Math.max(densityIntent, 0.75)
  }

  // [PHASE AA1] Apply explicit-method-preference floors AFTER the doctrine-
  // derived score. Math.max means a stronger doctrine signal (e.g. 0.75 from
  // multi-token match) wins over the 0.6 floor, but a zero-doctrine score
  // gets lifted to 0.6 so the budget plan does not return NOT_NEEDED for a
  // method the user explicitly opted into.
  for (const prefId of normalizedExplicitPrefs) {
    if (prefId === 'circuits' || prefId === 'density_blocks') {
      densityIntent = Math.max(densityIntent, EXPLICIT_PREF_FLOOR)
      // Circuits also signal endurance work-capacity intent; density blocks
      // do not (density on accessory rows is hypertrophy-density, not
      // endurance-density).
      if (prefId === 'circuits') {
        enduranceIntent = Math.max(enduranceIntent, EXPLICIT_PREF_FLOOR)
      }
    } else if (prefId === 'rest_pause' || prefId === 'drop_sets') {
      hypertrophyIntent = Math.max(hypertrophyIntent, EXPLICIT_PREF_FLOOR)
    } else if (prefId === 'top_sets' || prefId === 'cluster_sets') {
      strengthIntent = Math.max(strengthIntent, EXPLICIT_PREF_FLOOR)
    } else if (prefId === 'ladder_sets') {
      enduranceIntent = Math.max(enduranceIntent, EXPLICIT_PREF_FLOOR)
    }
  }

  // Mobility / Flexibility
  let mobilityIntent = score(MOBILITY_TOKENS)
  let flexibilityIntent = score(FLEXIBILITY_TOKENS, [selectedFlexibility.join(' ')])
  if (selectedFlexibility.length > 0) flexibilityIntent = Math.max(flexibilityIntent, 0.75)
  if (primary === 'mobility') mobilityIntent = 1.0
  if (primary === 'flexibility') flexibilityIntent = 1.0

  // -------------------------------------------------------------------------
  // 3. Safety / experience / recovery dimensions
  // -------------------------------------------------------------------------

  // Tendon protection — any tendon-sensitive skill present OR explicit joint caution
  const skillBlob = skills.join(' ')
  let tendonProtectionIntent = 0
  for (const t of TENDON_SENSITIVE_SKILLS) {
    if (skillBlob.includes(t)) {
      tendonProtectionIntent = Math.max(tendonProtectionIntent, 0.75)
      break
    }
  }
  const jointCautions = (profile?.jointCautions ?? []).map(j => String(j).toLowerCase())
  if (jointCautions.length > 0) {
    recordUsed('jointCautions')
    tendonProtectionIntent = Math.max(tendonProtectionIntent, 0.75)
    if (jointCautions.some(j => j.includes('elbow') || j.includes('shoulder') || j.includes('wrist'))) {
      tendonProtectionIntent = 1.0
    }
  } else {
    recordMissing('jointCautions')
  }

  // Recovery protection — any negative recovery signal
  const recoveryQuality = String(profile?.recoveryQuality ?? '').toLowerCase()
  let recoveryProtectionIntent = 0
  if (recoveryQuality) {
    recordUsed('recoveryQuality')
    if (RECOVERY_FLAG_TOKENS.some(t => recoveryQuality.includes(t))) {
      recoveryProtectionIntent = 0.75
    }
  } else {
    recordMissing('recoveryQuality')
  }

  // Advanced-athlete signal — combines experience field + benchmarks
  const experience = String(profile?.experienceLevel ?? profile?.trainingExperience ?? '').toLowerCase()
  let advancedAthleteSignal = 0
  let beginnerProtectionSignal = 0
  if (experience) {
    recordUsed('experienceLevel')
    if (experience === 'advanced') advancedAthleteSignal = 1.0
    else if (experience === 'intermediate') advancedAthleteSignal = 0.5
    else if (experience === 'beginner' || experience === 'new') beginnerProtectionSignal = 1.0
    else if (experience === 'some') beginnerProtectionSignal = 0.5
  } else {
    recordMissing('experienceLevel')
  }

  // Weighted benchmarks — strong advanced signal regardless of self-reported level
  const wpu = profile?.weightedPullUp
  const wdp = profile?.weightedDip
  if (wpu && typeof wpu.addedWeight === 'number' && wpu.addedWeight > 0) {
    recordUsed('weightedPullUp')
    if (wpu.addedWeight >= 45) advancedAthleteSignal = Math.max(advancedAthleteSignal, 1.0)
    else if (wpu.addedWeight >= 25) advancedAthleteSignal = Math.max(advancedAthleteSignal, 0.75)
    strengthIntent = Math.max(strengthIntent, 0.75)
  }
  if (wdp && typeof wdp.addedWeight === 'number' && wdp.addedWeight > 0) {
    recordUsed('weightedDip')
    if (wdp.addedWeight >= 90) advancedAthleteSignal = Math.max(advancedAthleteSignal, 1.0)
    else if (wdp.addedWeight >= 45) advancedAthleteSignal = Math.max(advancedAthleteSignal, 0.75)
    strengthIntent = Math.max(strengthIntent, 0.75)
  }

  // -------------------------------------------------------------------------
  // 4. Frequency / duration signals
  // -------------------------------------------------------------------------

  const weeklyFrequencySignal = typeof profile?.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : null
  if (weeklyFrequencySignal !== null) recordUsed('trainingDaysPerWeek')
  else recordMissing('trainingDaysPerWeek')

  const sessionDurationSignal = sessionLength

  const equipmentSignals = (profile?.equipmentAvailable ?? []).map(e => String(e).toLowerCase())
  if (equipmentSignals.length > 0) recordUsed('equipmentAvailable')
  else recordMissing('equipmentAvailable')

  // -------------------------------------------------------------------------
  // 5. Confidence + warnings
  // -------------------------------------------------------------------------

  const confidence: TrainingIntentVector['confidence'] =
    used.length >= 8 ? 'strong' : used.length >= 5 ? 'usable' : used.length >= 2 ? 'partial' : 'low'

  if (skillIntent > 0 && tendonProtectionIntent === 0) {
    warnings.push('Skill intent present without tendon-protection signal — ensure jointCautions are honest.')
  }
  if (advancedAthleteSignal === 0 && (strengthIntent >= 0.75 || hypertrophyIntent >= 0.75)) {
    warnings.push('High strength/hypertrophy intent without advanced-athlete signal — methods will use beginner-safe bounds.')
  }

  return {
    version: 'phase-aa1',
    strengthIntent: clamp01(strengthIntent),
    hypertrophyIntent: clamp01(hypertrophyIntent),
    skillIntent: clamp01(skillIntent),
    enduranceIntent: clamp01(enduranceIntent),
    densityIntent: clamp01(densityIntent),
    mobilityIntent: clamp01(mobilityIntent),
    flexibilityIntent: clamp01(flexibilityIntent),
    recoveryProtectionIntent: clamp01(recoveryProtectionIntent),
    tendonProtectionIntent: clamp01(tendonProtectionIntent),
    advancedAthleteSignal: clamp01(advancedAthleteSignal),
    beginnerProtectionSignal: clamp01(beginnerProtectionSignal),
    weeklyFrequencySignal,
    sessionDurationSignal,
    selectedSkills: skills,
    selectedTrainingStyles: styles,
    selectedTrainingMethods: trainingMethods,
    equipmentSignals,
    explicitMethodPreferences: normalizedExplicitPrefs,
    explicitMethodPreferenceBoosts,
    sourceFieldsUsed: used,
    sourceFieldsMissing: missing,
    confidence,
    warnings,
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}
