# Adaptive Athlete Engine - Integration Architecture

## Overview

The Adaptive Athlete Engine is SpartanLab's unified coaching intelligence system. It synthesizes all training data and athlete information into one coherent decision pipeline, ensuring every workout recommendation comes from the same source of truth.

## Engine Decision Pipeline

The engine follows this exact order for every training decision:

```
1. AthleteProfile Load       → Root input for all decisions
2. SkillState Load           → Skill-specific memory and current levels
3. Readiness Calculation     → Component-level readiness breakdown
4. Constraint Detection      → Primary limitations and emphasis areas
5. Performance Envelope      → Learned training response patterns
6. Training Style Profile    → Athlete's preferred training approach
7. Equipment Filtering       → Available tools for exercise selection
8. Fatigue Assessment        → Recovery state and deload triggers
9. Program Generation        → Actual workout prescriptions
10. Version Management       → Track structural vs session changes
11. Output                   → Dashboard and next workout display
```

## Core Components

### 1. AthleteProfile (Root Input)
**File:** `lib/data-service.ts`, `lib/athlete-profile.ts`

The foundation for all decisions. Contains:
- Physical attributes (height, weight, body fat)
- Training preferences (days/week, session duration)
- Equipment profile
- Goals and priorities
- Joint cautions and injuries
- Training age and experience

### 2. SkillState
**File:** `lib/skill-state-service.ts`

Per-skill memory tracking:
- Current level vs highest achieved
- Current best metric vs historical best
- Readiness score per skill
- Limiting factor identification
- Next milestone targeting
- Coaching context (returning, building, maintaining)

Supported skills:
- `front_lever`
- `back_lever`
- `planche`
- `hspu`
- `muscle_up`
- `l_sit`

### 3. Readiness Breakdown
**File:** `lib/unified-coaching-engine.ts`

Component-level readiness scores:
- Pull strength score
- Push strength score
- Straight-arm score
- Compression score
- Scapular control score
- Shoulder stability score
- Wrist tolerance score
- Mobility score

### 4. Constraint Detection
**File:** `lib/constraint-detection-engine.ts`, `lib/constraint-integration.ts`

Identifies primary and secondary limitations:
- Maps constraints to volume adjustments
- Recommends which movement families to increase/maintain/decrease
- Provides explanations for program emphasis

Categories:
- `pull_strength`
- `push_strength`
- `straight_arm_pull_strength`
- `straight_arm_push_strength`
- `compression_strength`
- `scapular_control`
- `shoulder_stability`
- `wrist_tolerance`
- `mobility`

### 5. Performance Envelope
**File:** `lib/performance-envelope-engine.ts`, `lib/performance-envelope-service.ts`

Learns athlete-specific training responses:
- Preferred rep ranges per movement family
- Preferred set counts per session
- Preferred weekly volume
- Density tolerance (low/moderate/high)
- Fatigue thresholds
- Confidence scoring

### 6. Training Style Profile
**File:** `lib/unified-coaching-engine.ts`

Style modes with priority weighting:
- `skill_focused` - High-frequency skill exposure
- `strength_focused` - Lower reps, longer rest, weighted emphasis
- `power_focused` - Explosive movement development
- `endurance_focused` - Work capacity and density
- `hypertrophy_supported` - Skill-first with targeted muscle work
- `balanced_hybrid` - Moderate across all qualities

### 7. Movement Family System
**File:** `lib/movement-family-registry.ts`, `lib/exercise-classification-registry.ts`

20+ movement families:
- vertical_pull, horizontal_pull
- straight_arm_pull, straight_arm_push
- compression_core, scapular_control
- dip_pattern, squat_pattern
- etc.

Exercise classification includes:
- Primary and secondary families
- Training intents (skill, strength, hypertrophy, etc.)
- Skill carryover tags
- Equipment requirements
- Difficulty bands

### 8. Fatigue Assessment
**File:** `lib/fatigue-decision-engine.ts`, `lib/unified-coaching-engine.ts`

States: `fresh`, `normal`, `fatigued`, `overtrained`

Triggers session adjustments:
- Volume multiplier (0.5 - 1.0)
- Intensity multiplier
- Density reduction
- Accessory skipping
- Extra recovery protocols

### 9. Program Generation
**File:** `lib/unified-program-generation.ts`

Produces structured sessions:
- Warmup block (essential)
- Skill block (essential)
- Strength block (essential)
- Accessory block (optional)
- Cooldown block (important)

### 10. Workout Feedback Loop
**File:** `lib/workout-feedback-integration.ts`

Closes the loop by processing logs:
- Records training response signals
- Updates skill states
- Detects adaptation triggers
- Feeds performance envelope learning

## Session vs Structural Adaptation

### Session-Level (Minor/Moderate)
- Exercise replacement
- Volume reduction for fatigue
- Progression adjustment
- Time compression

Does NOT create new program version.

### Structural-Level (Major)
- Frequency change
- Duration change
- Equipment change
- Goal change
- Style change
- Major deload

Creates new ProgramVersion with reason tracking.

## Coaching Summary

Every context build includes human-readable summary:
- Headline (current focus)
- Focus areas list
- Current emphasis
- Style description
- Constraint note
- Fatigue note
- Protocol note
- Session notes
- Confidence level

## Usage Example

```typescript
import { buildUnifiedContext, generateUnifiedProgram } from '@/lib/engine'

// Build complete context
const context = await buildUnifiedContext(userId)

// Access any component
console.log(context.athlete.primaryGoal)
console.log(context.skills.primarySkillState?.nextMilestone)
console.log(context.constraints.primaryConstraint)
console.log(context.envelope.recommendations)
console.log(context.fatigue.sessionAdjustments)
console.log(context.coachingSummary.headline)

// Generate program
const program = await generateUnifiedProgram(userId)
```

## Data Quality Assessment

The engine tracks confidence levels:
- `excellent` - Full data across all systems
- `good` - Most systems have data
- `partial` - Some gaps in data
- `insufficient` - New user or sparse data

Low confidence triggers conservative programming.

## Performance Considerations

- Context is built on-demand, not on every render
- Snapshots cache expensive calculations
- Signals are recorded async after workout completion
- Envelope updates batch during recalculation points

## Integration Points

| System | Reads From | Writes To |
|--------|-----------|-----------|
| Dashboard | UnifiedContext | - |
| Workout | UnifiedContext, Program | WorkoutLogs |
| Settings | - | AthleteProfile |
| Onboarding | - | AthleteProfile, SkillState |
| Logging | WorkoutData | Envelopes, SkillState |
| Override | Context | AdaptationEvents |
