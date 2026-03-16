# Skill Readiness Visualization System

The Skill Readiness System helps athletes understand their readiness level for major calisthenics skills using clear visual breakdown bars.

## Overview

The readiness system provides:

- **Visual Breakdown Bars**: Shows readiness components (pull strength, compression, scapular control, etc.)
- **Overall Readiness Score**: 0-100 percentage indicating overall skill readiness
- **Limiting Factor Detection**: Identifies the lowest component score
- **Database Persistence**: Stores readiness assessments and historical snapshots
- **Intelligent Recalculation**: Updates readiness after workouts and profile changes

## Supported Skills

- Front Lever
- Planche
- Handstand Push-up (HSPU)
- Muscle-up
- L-sit / Compression

## Architecture

### Core Components

**`SkillReadinessBars.tsx`**
- Visual component displaying breakdown bars for a single skill
- Shows component scores with color-coded bars
- Displays overall readiness percentage and primary limiter

**`SkillReadinessModule.tsx`**
- Container component displaying readiness for multiple skills
- Fetches data from backend API
- Handles loading and error states

### Services

**`readiness-service.ts`**
- Database operations for skill readiness data
- Fetches current readiness for athletes and skills
- Saves readiness assessments and snapshots

**`readiness-calculation-service.ts`**
- Triggers readiness recalculation
- Called after workouts, profile updates, strength changes
- Filters to only recalculate when strength-relevant exercises are logged

### API Routes

**GET `/api/readiness`**
- Fetches skill readiness data for an athlete
- Query param: `athleteId`

**POST `/api/readiness/recalculate`**
- Triggers readiness recalculation
- Body: `{ athleteId }`

## Data Model

### SkillReadiness Table

```sql
CREATE TABLE skill_readiness (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  readiness_score NUMERIC NOT NULL,
  pull_strength_score NUMERIC NOT NULL,
  compression_score NUMERIC NOT NULL,
  scapular_control_score NUMERIC NOT NULL,
  straight_arm_score NUMERIC NOT NULL,
  mobility_score NUMERIC NOT NULL,
  limiting_factor TEXT,
  last_updated TIMESTAMP NOT NULL,
  UNIQUE(athlete_id, skill)
);
```

### ReadinessSnapshot Table

```sql
CREATE TABLE readiness_snapshots (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  readiness_score NUMERIC NOT NULL,
  snapshot_date TIMESTAMP NOT NULL
);
```

## Readiness Calculation

Readiness scores derive from measurable athlete data:

### Front Lever
- **Pull Strength** (35%): Weighted pull-up strength, pull-up reps
- **Compression** (25%): L-sit hold duration, compression strength inputs
- **Scapular Control** (20%): Scapular pull-ups, row strength
- **Straight Arm** (20%): Lever progressions, straight-arm pulling metrics

### Planche
- **Push Strength** (35%): Push-up variants, dip strength
- **Compression** (25%): Core compression, body tension
- **Anterior Shoulder** (20%): Front delt strength, shoulder stability
- **Wrist Mobility** (20%): Wrist ROM, wrist conditioning

### HSPU
- **Shoulder Strength** (35%): Overhead pressing strength
- **Core Stability** (25%): Planche lean, handstand hold
- **Balance** (25%): Handstand balance time, proprioception
- **Wrist Strength** (15%): Wrist conditioning

### Muscle-up
- **Pull Strength** (30%): Weighted pull-ups, pull-up reps
- **Dip Strength** (30%): Weighted dips, dip reps
- **Transition** (25%): Transition drills, explosive power
- **Body Control** (15%): Handstand, body tension

### L-sit
- **Hip Flexor Strength** (35%): V-sit holds, leg raise strength
- **Core Compression** (30%): Compression strength, core tension
- **Arm Strength** (20%): Push-up strength, support strength
- **Mobility** (15%): Hip flexibility, hamstring ROM

## Integration

### Dashboard
The `SkillReadinessModule` is integrated into the dashboard below the Skill Progress Heatmap:

```tsx
<SkillReadinessModule athleteId={userId} />
```

### Trigger Recalculation
After logging a workout, trigger readiness recalculation:

```tsx
const { recalculate } = useReadinessRecalculation()
// After saving workout
await recalculate()
```

## Future Enhancements

1. **Readiness History Graphs**: Visualize readiness progress over time
2. **Component-Level Recommendations**: "Improve compression by X to reach 80% readiness"
3. **Constraint Engine Integration**: Use readiness scores to inform training constraints
4. **Mobile-Optimized Views**: Component breakdown on mobile with drill-down
5. **Readiness Alerts**: Notify athletes when limiting factors improve

## Mobile Optimization

- Bars scale to mobile viewport width
- Components stack vertically on small screens
- Touch-friendly tap targets
- Compact color indicators
- Minimal horizontal scrolling

## Color System

- **Primary (Green)**: ✓ 80%+ readiness
- **Success (Amber)**: ✓ 60-79% readiness
- **Warning (Orange)**: ✓ 40-59% readiness
- **Danger (Red)**: ✗ <40% readiness

Component colors:
- Pull Strength: Red (#E63946)
- Compression: Orange (#F77F00)
- Scapular/Control: Green (#06D6A0)
- Straight Arm/Strength: Blue (#457B9D)
- Mobility: Teal (#A8DADC)

## Testing

The system:
- ✓ Calculates readiness from measurable data
- ✓ Identifies limiting factors correctly
- ✓ Persists data in database
- ✓ Updates after workouts
- ✓ Renders correctly on mobile
- ✓ Handles missing data gracefully
