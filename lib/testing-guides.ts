// =============================================================================
// TESTING GUIDES CONTENT
// =============================================================================
// Structured testing instructions for strength, skill, and flexibility benchmarks

export type TestCategory = 'strength' | 'skill' | 'flexibility'

export interface TestingGuide {
  id: string
  name: string
  category: TestCategory
  shortDescription: string
  warmUp: string[]
  howToTest: string[]
  whatCounts: string[]
  howToRecord: string
  safetyNotes?: string[]
  videoPlaceholder?: string
}

// =============================================================================
// STRENGTH TESTING GUIDES
// =============================================================================

export const STRENGTH_TESTS: TestingGuide[] = [
  {
    id: 'max-pull-ups',
    name: 'Max Pull-Ups',
    category: 'strength',
    shortDescription: 'Test your maximum strict pull-up reps in a single set.',
    warmUp: [
      '5-10 minutes light cardio or arm circles',
      '2 sets of 3-5 easy pull-ups or band-assisted pull-ups',
      'Rest 2-3 minutes before testing'
    ],
    howToTest: [
      'Start from a dead hang with arms fully extended',
      'Pull until chin clears the bar',
      'Lower with control to full extension',
      'Continue until you cannot complete another clean rep'
    ],
    whatCounts: [
      'Full range of motion: dead hang to chin over bar',
      'No kipping, swinging, or excessive body movement',
      'Controlled descent (no dropping)',
      'Brief pause at bottom is acceptable'
    ],
    howToRecord: 'Record the total number of clean reps completed before failure or form breakdown.',
    safetyNotes: [
      'Stop if you feel sharp pain in shoulders or elbows',
      'Do not test if you have recent upper body injuries'
    ]
  },
  {
    id: 'max-dips',
    name: 'Max Dips',
    category: 'strength',
    shortDescription: 'Test your maximum parallel bar dip reps.',
    warmUp: [
      '5-10 minutes light cardio',
      '10-15 push-ups',
      '2 sets of 3-5 easy dips',
      'Rest 2-3 minutes before testing'
    ],
    howToTest: [
      'Start at the top with arms locked out',
      'Lower until upper arms are parallel to ground (or deeper)',
      'Press back to full lockout',
      'Continue until form breaks down'
    ],
    whatCounts: [
      'Full lockout at top',
      'Upper arms reach at least parallel at bottom',
      'No excessive forward lean or swinging',
      'Controlled movement throughout'
    ],
    howToRecord: 'Record total clean reps. If you can do more than 20, consider testing weighted dips instead.',
    safetyNotes: [
      'Do not go deeper than comfortable for your shoulders',
      'Keep shoulders down and back'
    ]
  },
  {
    id: 'max-push-ups',
    name: 'Max Push-Ups',
    category: 'strength',
    shortDescription: 'Test your maximum strict push-up reps.',
    warmUp: [
      '5-10 minutes light movement',
      '10 arm circles each direction',
      '1 set of 10 easy push-ups',
      'Rest 1-2 minutes'
    ],
    howToTest: [
      'Start in plank position with arms extended',
      'Lower chest to touch the ground (or 1 inch above)',
      'Press back to full extension',
      'Maintain straight body line throughout'
    ],
    whatCounts: [
      'Chest reaches near or touches ground',
      'Full arm extension at top',
      'Body stays in straight line (no sagging hips)',
      'No pausing longer than 2 seconds at top'
    ],
    howToRecord: 'Record total clean reps before failure or form breakdown.',
    safetyNotes: [
      'Stop if you feel wrist or shoulder pain'
    ]
  },
  {
    id: 'weighted-pull-up',
    name: 'Weighted Pull-Up',
    category: 'strength',
    shortDescription: 'Test your max added weight for a single pull-up rep.',
    warmUp: [
      '5-10 minutes light cardio',
      '2 sets of 5 bodyweight pull-ups',
      '1 set at 50% estimated max weight',
      '1 set at 75% estimated max weight',
      'Rest 3-5 minutes between warm-up sets'
    ],
    howToTest: [
      'Add weight via belt, vest, or dumbbell between legs',
      'Perform a single strict pull-up',
      'If successful, rest 3-5 minutes and add weight',
      'Continue until you fail a rep',
      'Your max is the last successful weight'
    ],
    whatCounts: [
      'Dead hang start, chin over bar finish',
      'No kipping or momentum',
      'Controlled rep, not a grind that takes 10 seconds',
      'Clean single rep'
    ],
    howToRecord: 'Record the added weight (not total weight). Example: "+25 lbs" or "+10 kg"',
    safetyNotes: [
      'Have a spotter or safe way to bail if needed',
      'Small jumps (5-10 lbs) near your max'
    ]
  },
  {
    id: 'weighted-dip',
    name: 'Weighted Dip',
    category: 'strength',
    shortDescription: 'Test your max added weight for a single dip rep.',
    warmUp: [
      '5-10 minutes light movement',
      '10-15 push-ups',
      '2 sets of 5 bodyweight dips',
      '1 set at 50% estimated max',
      '1 set at 75% estimated max',
      'Rest 3-5 minutes between warm-up sets'
    ],
    howToTest: [
      'Add weight via belt, vest, or dumbbell between legs',
      'Perform a single strict dip',
      'If successful, rest 3-5 minutes and add weight',
      'Continue until failure',
      'Your max is the last successful weight'
    ],
    whatCounts: [
      'Full lockout at top',
      'Upper arms at least parallel at bottom',
      'No excessive swinging',
      'Clean controlled rep'
    ],
    howToRecord: 'Record added weight only. Example: "+45 lbs" or "+20 kg"',
    safetyNotes: [
      'Do not force depth if shoulders protest',
      'Small weight jumps near your max'
    ]
  },
  {
    id: 'wall-hspu',
    name: 'Wall Handstand Push-Ups',
    category: 'strength',
    shortDescription: 'Test your max wall handstand push-up reps.',
    warmUp: [
      '5-10 minutes light cardio',
      '10-15 pike push-ups',
      '30-60 second wall handstand hold',
      '2-3 easy wall HSPU reps',
      'Rest 2-3 minutes'
    ],
    howToTest: [
      'Kick up to wall handstand (chest facing wall or back to wall)',
      'Lower head to touch ground or pad',
      'Press back to full lockout',
      'Continue until failure'
    ],
    whatCounts: [
      'Head touches floor (or consistent depth marker)',
      'Full arm extension at top',
      'Controlled movement, no dropping',
      'Minimal rest at top between reps'
    ],
    howToRecord: 'Record total clean reps. Note whether chest-to-wall or back-to-wall.',
    safetyNotes: [
      'Use a pad under your head if needed',
      'Know how to safely bail from a handstand',
      'Stop if you feel neck or shoulder strain'
    ]
  }
]

// =============================================================================
// SKILL TESTING GUIDES
// =============================================================================

export const SKILL_TESTS: TestingGuide[] = [
  {
    id: 'front-lever',
    name: 'Front Lever',
    category: 'skill',
    shortDescription: 'Determine your front lever progression level and hold time.',
    warmUp: [
      '5-10 minutes light cardio',
      '2 sets of 5 pull-ups',
      '2 sets of 10 second active hang',
      '1-2 tuck front lever holds',
      'Rest 2-3 minutes'
    ],
    howToTest: [
      'Start with the easiest progression you can hold (tuck)',
      'Hold for max time with clean form',
      'If you hold 10+ seconds cleanly, try the next progression',
      'Continue until you find your max clean hold',
      'Progressions: Tuck → Advanced Tuck → One-Leg → Straddle → Full'
    ],
    whatCounts: [
      'Body horizontal (hips not sagging)',
      'Arms straight (no bent elbows)',
      'Shoulders depressed (not shrugged)',
      'Controlled position, not shaking violently'
    ],
    howToRecord: 'Record your progression level and best hold time. Example: "Advanced Tuck - 8 seconds"',
    safetyNotes: [
      'Stop if you feel bicep tendon strain',
      'Do not force progressions you cannot hold for at least 3 seconds'
    ]
  },
  {
    id: 'planche',
    name: 'Planche',
    category: 'skill',
    shortDescription: 'Determine your planche progression level and hold time.',
    warmUp: [
      '5-10 minutes light cardio',
      'Wrist warm-up circles and stretches',
      '2 sets of planche leans (15-20 seconds)',
      '1-2 tuck planche attempts',
      'Rest 2-3 minutes'
    ],
    howToTest: [
      'Start with tuck planche on floor or parallettes',
      'Hold for max time with clean form',
      'If you hold 10+ seconds, try advanced tuck',
      'Continue testing progressions',
      'Progressions: Tuck → Advanced Tuck → Straddle → Full'
    ],
    whatCounts: [
      'Hips at shoulder height (not piked)',
      'Arms straight and locked',
      'Shoulders protracted (pushed forward)',
      'Controlled hold, not collapsing'
    ],
    howToRecord: 'Record progression level and hold time. Example: "Straddle - 5 seconds"',
    safetyNotes: [
      'Warm up wrists thoroughly',
      'Do not force straight arm positions if elbows hurt'
    ]
  },
  {
    id: 'muscle-up',
    name: 'Muscle-Up',
    category: 'skill',
    shortDescription: 'Test your muscle-up ability on bar or rings.',
    warmUp: [
      '5-10 minutes light cardio',
      '2 sets of 5 pull-ups',
      '2 sets of 5 straight bar dips (if testing bar MU)',
      '1-2 high pull attempts',
      'Rest 2-3 minutes'
    ],
    howToTest: [
      'Attempt a strict muscle-up (minimal kip)',
      'If successful, rest and try another',
      'Count how many you can do in one set',
      'Note if bar or rings, and if strict or with kip'
    ],
    whatCounts: [
      'Start from dead hang',
      'Transition smoothly through the middle',
      'Finish in full dip lockout',
      'Strict = minimal swing; note if kipping'
    ],
    howToRecord: 'Record reps and style. Example: "3 strict ring muscle-ups" or "1 kipping bar muscle-up"',
    safetyNotes: [
      'Master pull-ups and dips before attempting',
      'Be careful with false grip strain on rings'
    ]
  },
  {
    id: 'l-sit',
    name: 'L-Sit Hold',
    category: 'skill',
    shortDescription: 'Test your L-sit hold time on floor, parallettes, or bars.',
    warmUp: [
      '5 minutes light movement',
      '10-15 leg raises',
      '20-30 seconds tucked L-sit',
      'Hip flexor activation drills',
      'Rest 1-2 minutes'
    ],
    howToTest: [
      'Get into L-sit position on your surface',
      'Hold with legs straight and horizontal',
      'Time your hold from stable position to failure',
      'If you cannot hold straight legs, test tucked or one-leg'
    ],
    whatCounts: [
      'Hips off the ground',
      'Legs straight (or note if tucked/one-leg)',
      'Legs at least horizontal',
      'Shoulders depressed, not shrugged'
    ],
    howToRecord: 'Record hold time and variation. Example: "Full L-sit - 15 seconds" or "Tucked - 25 seconds"',
    safetyNotes: [
      'Wrist warm-up if doing floor L-sit'
    ]
  },
  {
    id: 'v-sit',
    name: 'V-Sit Hold',
    category: 'skill',
    shortDescription: 'Test your V-sit hold time and leg position.',
    warmUp: [
      '5 minutes light movement',
      'Pike stretches',
      '20-30 seconds L-sit hold',
      'Compression drills',
      'Rest 1-2 minutes'
    ],
    howToTest: [
      'Get into V-sit position (legs above horizontal)',
      'Hold with legs as high as possible',
      'Time from stable position to failure',
      'Note the angle of your legs'
    ],
    whatCounts: [
      'Legs above L-sit (above horizontal)',
      'Legs straight',
      'Controlled position',
      'Higher leg angle = more advanced'
    ],
    howToRecord: 'Record hold time and approximate leg angle. Example: "V-sit 45° - 8 seconds"',
    safetyNotes: [
      'Master L-sit before attempting V-sit'
    ]
  },
  {
    id: 'i-sit',
    name: 'I-Sit / Manna',
    category: 'skill',
    shortDescription: 'Test your manna/I-sit progression and hold time.',
    warmUp: [
      '5-10 minutes light movement',
      'Thorough hip and hamstring warm-up',
      '30+ seconds V-sit hold',
      'Manna lean drills',
      'Rest 2-3 minutes'
    ],
    howToTest: [
      'Attempt to lift legs toward vertical behind you',
      'Hold your highest clean position',
      'Time the hold',
      'Note how close legs are to vertical'
    ],
    whatCounts: [
      'Hips elevated, shoulders back',
      'Legs extending upward behind center of mass',
      'Controlled position',
      'True manna = legs at or past vertical'
    ],
    howToRecord: 'Record progression and time. Example: "High V-sit / pre-manna - 3 seconds"',
    safetyNotes: [
      'This is an elite skill - do not force it',
      'Requires exceptional hip flexibility'
    ]
  }
]

// =============================================================================
// FLEXIBILITY TESTING GUIDES
// =============================================================================

export const FLEXIBILITY_TESTS: TestingGuide[] = [
  {
    id: 'pancake',
    name: 'Pancake Stretch',
    category: 'flexibility',
    shortDescription: 'Assess your straddle/pancake flexibility depth.',
    warmUp: [
      '5 minutes light cardio to raise body temperature',
      '10 leg swings each leg (front/back and side)',
      '30 seconds butterfly stretch',
      '30 seconds standing straddle fold',
      'Do NOT static stretch cold'
    ],
    howToTest: [
      'Sit in straddle position with legs as wide as comfortable',
      'Keep legs straight (slight knee bend is okay)',
      'Fold forward from hips, reaching chest toward floor',
      'Note how far you can reach'
    ],
    whatCounts: [
      'Chest to floor = full pancake',
      'Forearms on floor = advanced',
      'Hands on floor = intermediate',
      'Reaching toward floor but not touching = beginner'
    ],
    howToRecord: 'Record your depth: "Chest to floor", "Forearms down", "Hands down", or "Working toward floor"',
    safetyNotes: [
      'Never force flexibility cold',
      'Discomfort is okay, sharp pain is not'
    ]
  },
  {
    id: 'forward-fold',
    name: 'Forward Fold / Toe Touch',
    category: 'flexibility',
    shortDescription: 'Test your standing or seated forward fold range.',
    warmUp: [
      '5 minutes light cardio',
      '10 leg swings each leg',
      '30 seconds gentle standing fold',
      'Do NOT bounce or force'
    ],
    howToTest: [
      'Stand with feet together (or sit with legs extended)',
      'Fold forward from hips with straight legs',
      'Reach toward toes/floor',
      'Note where your hands reach'
    ],
    whatCounts: [
      'Palms flat past toes = excellent',
      'Touch toes = good',
      'Reach ankles = developing',
      'Reach shins = limited (work on this!)'
    ],
    howToRecord: 'Record your reach: "Palms past toes", "Touch toes", "Ankles", or "Shins"',
    safetyNotes: [
      'Keep slight bend in knees if hamstrings are very tight',
      'Do not round excessively through lower back'
    ]
  },
  {
    id: 'front-splits',
    name: 'Front Splits',
    category: 'flexibility',
    shortDescription: 'Assess your front split depth on each leg.',
    warmUp: [
      '5-10 minutes light cardio',
      'Dynamic leg swings (front/back)',
      'Lunge stretches each side',
      'Half-split (runner\'s stretch) each side',
      '60-90 seconds each position'
    ],
    howToTest: [
      'Slide into front split position with support (blocks/hands)',
      'Square hips as much as possible',
      'Lower as far as comfortable',
      'Test both sides'
    ],
    whatCounts: [
      'Full split (hips on floor, squared) = advanced',
      '3-6 inches from floor = intermediate',
      '6-12 inches from floor = developing',
      '12+ inches from floor = beginner'
    ],
    howToRecord: 'Record depth for each leg. Example: "Right: 4 inches from floor, Left: 6 inches"',
    safetyNotes: [
      'Use blocks or supports',
      'Do not bounce into the split',
      'Back knee can have a pad underneath'
    ]
  },
  {
    id: 'side-splits',
    name: 'Side Splits / Middle Splits',
    category: 'flexibility',
    shortDescription: 'Assess your middle/side split depth.',
    warmUp: [
      '5-10 minutes light cardio',
      'Side-to-side leg swings',
      'Deep sumo squats',
      'Straddle stretch on floor',
      'Frog stretch',
      '60-90 seconds each position'
    ],
    howToTest: [
      'Stand and slowly slide feet apart',
      'Use wall or supports for balance',
      'Lower as far as comfortable',
      'Keep torso upright or slightly forward'
    ],
    whatCounts: [
      'Full middle split (hips on floor) = advanced',
      '3-6 inches from floor = intermediate',
      '6-12 inches from floor = developing',
      '12+ inches from floor = beginner'
    ],
    howToRecord: 'Record your depth. Example: "8 inches from floor"',
    safetyNotes: [
      'Go slowly - this position loads the adductors',
      'Stop if you feel anything in the knees',
      'Use a wall or chair for support'
    ]
  }
]

// =============================================================================
// COMBINED GUIDES
// =============================================================================

export const ALL_TESTING_GUIDES: TestingGuide[] = [
  ...STRENGTH_TESTS,
  ...SKILL_TESTS,
  ...FLEXIBILITY_TESTS
]

export function getTestingGuide(id: string): TestingGuide | undefined {
  return ALL_TESTING_GUIDES.find(g => g.id === id)
}

export function getTestingGuidesByCategory(category: TestCategory): TestingGuide[] {
  return ALL_TESTING_GUIDES.filter(g => g.category === category)
}

// =============================================================================
// METRIC TO GUIDE MAPPING
// =============================================================================

// Maps onboarding/profile metric keys to testing guide IDs
export const METRIC_TO_GUIDE: Record<string, string> = {
  // Strength
  pullUpMax: 'max-pull-ups',
  dipMax: 'max-dips',
  pushUpMax: 'max-push-ups',
  weightedPullUp: 'weighted-pull-up',
  weightedDip: 'weighted-dip',
  wallHSPUReps: 'wall-hspu',
  
  // Skills
  frontLever: 'front-lever',
  planche: 'planche',
  muscleUp: 'muscle-up',
  lSitHold: 'l-sit',
  vSitHold: 'v-sit',
  iSitHold: 'i-sit',
  
  // Flexibility
  pancake: 'pancake',
  forwardFold: 'forward-fold',
  frontSplits: 'front-splits',
  sideSplits: 'side-splits'
}

export function getGuideForMetric(metricKey: string): TestingGuide | undefined {
  const guideId = METRIC_TO_GUIDE[metricKey]
  if (!guideId) return undefined
  return getTestingGuide(guideId)
}
