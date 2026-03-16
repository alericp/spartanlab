## Performance Envelope Modeling System - Implementation Summary

This document outlines the complete Performance Envelope Modeling system for SpartanLab, which learns each athlete's effective training response zones over time.

---

## System Components

### 1. Database Layer (`performance_envelopes` tables)
- **performance_envelopes**: Stores learned athlete response patterns
  - Fields: id, athlete_id, movement_family, goal_type, preferred_rep_range (min/max), preferred_set_range (min/max), preferred_weekly_volume (min/max), preferred_density_level, fatigue_threshold, performance_trend, confidence_score, signal_count, last_updated, created_at

- **performance_envelope_snapshots**: Historical tracking for analysis
  - Fields: id, athlete_id, movement_family, goal_type, rep_range, weekly_volume_range, density_level, fatigue_threshold, confidence_score, created_at

- **training_response_signals**: Individual workout performance data
  - Fields: id, athlete_id, movement_family, goal_type, reps_performed, sets_performed, rep_range, performance_metric, session_density, weekly_volume, difficulty_rating, completion_ratio, session_truncated, exercises_skipped, progression_adjustment, recorded_at, created_at

---

## Core Engine Files

### 2. `performance-envelope-engine.ts` (353 lines)
Main learning engine that analyzes signals and infers performance envelopes.

**Key Functions:**
- `analyzePerformanceEnvelope(signals, existingEnvelope)` - Core inference function that learns from signal data
- `generateEnvelopeInsight(envelope)` - Creates coaching-friendly insights from envelopes
- `getEnvelopeBasedRecommendations(envelope)` - Returns rep/volume/density/fatigue recommendations
- `updateEnvelopeWithSignals(envelope, signals)` - Incrementally updates envelope with new data

**Learning Logic:**
- Rep Range Scoring: Analyzes which rep ranges result in "hard" sessions with high completion (1-3 reps = "low", 4-6 = "moderate", 7+ = "high")
- Volume Optimization: Tracks optimal weekly volume by averaging across successful sessions and factoring in completion ratios
- Density Preference: Scores each density level by performance and difficulty rating
- Fatigue Threshold: Uses hard sessions and truncation patterns to estimate workload ceiling
- Confidence Scoring: Combines signal count (max 15), trend stability, and completion consistency (40% + 30% + 30%)

**Performance Trend Detection:**
- Compares last 3 sessions vs. older 3 sessions
- Marks as "improving" if recent completion ratio > older + 10%
- Marks as "declining" if recent completion ratio < older - 10%
- Otherwise "stable"

---

### 3. `performance-envelope-service.ts` (338 lines)
Database operations and persistence layer.

**Key Functions:**
- `getOrCreateEnvelope(athleteId, movementFamily, goalType)` - Retrieves or initializes envelope
- `recordSignal(signal)` - Stores individual workout performance
- `getRecentSignals(athleteId, family, goalType, limit)` - Fetches recent signals for analysis
- `updateEnvelopeFromSignals(athleteId, family, goalType)` - Triggers envelope recalculation
- `getAthleteEnvelopes(athleteId)` - Gets all athlete envelopes
- `getEnvelopeHistory(athleteId, family, goalType, limit)` - Historical trend tracking

**Database Patterns:**
- Upsert logic for envelope updates
- Atomic signal recording
- Indexed queries by athlete + movement family + goal type

---

### 4. `performance-envelope-integration.ts` (217 lines)
Integration layer connecting envelopes to program generation and adaptive systems.

**Key Functions:**
- `getEnvelopeRepRange(athleteId, family, goalType)` - Returns personalized rep range with confidence
- `getEnvelopeVolume(athleteId, family, goalType)` - Returns personalized weekly volume
- `getEnvelopeDensity(athleteId, family, goalType)` - Returns density preference
- `recordWorkoutEnvelopeSignals(athleteId, workoutLog, results)` - Records performance after workout
- `getEnvelopeCoachingInsights(athleteId)` - Generates top 3 coaching insights
- `detectFatigueTrendFromEnvelopes(athleteId)` - Identifies declining performance patterns
- `getEnvelopeBasedProgramAdjustments(athleteId, families)` - Provides program-generation inputs

---

## Integration Points

### With Program Generation (`adaptive-program-builder.ts`)
```typescript
// Import envelope service
import { getOrCreateEnvelope, getAthleteEnvelopes } from './performance-envelope-service'

// Use during rep range selection
const envelope = await getEnvelopeRepRange(athleteId, 'vertical_pull', 'strength')
// Returns: { min: 3, max: 5, confidence: 0.7 }

// Program generation uses confidence to decide:
// - High confidence (>0.5): Use envelope recommendations
// - Low confidence (<0.3): Use conservative defaults
// - Medium confidence: Blend envelope with style-based defaults
```

### With Adaptive Progression (`adaptive-progression-engine.ts`)
```typescript
// After workout logging, update envelopes
await recordWorkoutEnvelopeSignals(athleteId, workoutLog, movementResults)

// Use updated envelopes for progression decisions
const envelope = await getOrCreateEnvelope(athleteId, family, goalType)
if (envelope.performanceTrend === 'declining') {
  // Suggest easier progression or deload
}
```

### With Fatigue Detection (`fatigue-decision-engine.ts`)
```typescript
// Detect fatigue through envelope trends
const fatigue = await detectFatigueTrendFromEnvelopes(athleteId)
if (fatigue.hasFatigueConcern) {
  // Trigger deload in affected movement families
}
```

### With Workout Logging (`workout-log-service.ts`)
```typescript
// After workout completion
const movements = extractMovementPerformance(workoutLog)
await recordWorkoutEnvelopeSignals(athleteId, workoutLog, movements)
// Envelopes update asynchronously
```

---

## Movement Family Support

The system tracks separate envelopes for each:
- **Movement Family** (vertical_pull, horizontal_pull, straight_arm_pull, vertical_push, horizontal_push, straight_arm_push, dip_pattern, compression_core, etc.)
- **Goal Type** (strength, skill, endurance, hypertrophy, power)

Example: An athlete has separate envelopes for:
- vertical_pull + strength
- vertical_pull + skill
- straight_arm_pull + strength
- compression_core + skill
- etc.

---

## Data Flow Example

### Athlete's First Week
1. Athlete completes 5 workouts
2. `recordWorkoutEnvelopeSignals()` is called after each session
3. Signals stored in `training_response_signals` table
4. Envelopes initialized with low confidence (<0.3)

### After 3-4 Weeks
1. ~20-30 signals accumulated per movement family
2. `analyzePerformanceEnvelope()` detects patterns:
   - Rep range 3-5 consistently results in "normal" or "hard" with high completion
   - Rep range 8-10 often results in "hard" with lower completion
   - Confidence increases to 0.4-0.6
3. Program generation starts using envelope recommendations

### After 8+ Weeks
1. 50+ signals per family
2. Confidence >0.7 for most families
3. Clear performance trends emerge:
   - Performance improving in some families
   - Plateauing in others
   - Declining in overtrained areas
4. System can reliably recommend:
   - Personalized rep ranges (not generic)
   - Optimal weekly volume (not guessed)
   - Density that works (low/moderate/high based on data)
   - Fatigue thresholds (workload beyond which performance degrades)

---

## Coaching Insights Examples

### High Confidence Envelopes
- "You respond best to lower-rep vertical pulling work (3–5 reps)."
- "Your straight-arm work progresses best with 8–12 weekly sets."
- "High-density sessions are increasing fatigue; future sessions will be slightly less compressed."
- "Your planche compression improves best with lower volume and higher quality."

### Low Confidence
- "Need more training data to personalize vertical_pull programming."

---

## Confidence Scoring Logic

Confidence combines three factors (each 0-1):

1. **Signal Count (40%)**: More data = higher confidence
   - 1-5 signals: 20% confidence
   - 10 signals: 67% confidence
   - 15+ signals: 100% confidence

2. **Trend Stability (30%)**: Consistent patterns = higher confidence
   - Large variance in which rep ranges work best: low
   - Consistent best performer: high

3. **Completion Consistency (30%)**: Higher average completion = higher confidence
   - 70% completion: 70% confidence contribution
   - 95% completion: 95% confidence contribution

**Final = (signalConfidence × 0.4) + (stabilityConfidence × 0.3) + (completionConfidence × 0.3)**

Example: 8 signals, stable patterns, 90% avg completion
= (53% × 0.4) + (85% × 0.3) + (90% × 0.3) = 21% + 25.5% + 27% = **73.5% confidence**

---

## Deterministic Learning Rules

All learning follows explicit, explainable heuristics:

1. **Rep Range**: Tracks completion ratio × difficulty for each rep range. Highest = preferred.
2. **Volume**: Average successful session volume ± 25% = optimal range.
3. **Density**: Performance score = completion ratio × (1 if not "hard", 0.5 if "hard"). Highest = preferred.
4. **Fatigue**: Threshold = 1.2 × highest weekly volume from hard sessions.
5. **Trend**: Simple 3-session comparison with 10% threshold for change.

No black-box behavior. Every recommendation is traceable to actual athlete data.

---

## Performance Characteristics

- **Lightweight**: ~500 lines of core logic, deterministic calculations
- **Scalable**: One envelope per movement family per goal type (~50-100 per athlete max)
- **Asynchronous**: Envelope updates happen after workout logging, not on every page render
- **Incremental**: New signals gradually refine existing envelopes without full recalculation
- **Backward Compatible**: Works alongside existing generic programming logic

---

## Future Enhancements

Designed to support (without building now):
- Comparison of envelope evolution over months/seasons
- Skill-specific envelope analysis (e.g., Front Lever vs. Back Lever)
- Advanced cycle planning based on envelope trends
- Machine learning refinements (optional)
- A/B testing of program structures based on envelope responses

