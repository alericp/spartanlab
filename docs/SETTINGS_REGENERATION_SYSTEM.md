# SpartanLab Settings Regeneration System

## Overview

The settings regeneration system ensures that athlete settings changes update their training plan intelligently without breaking continuity or trust. Changes are classified into two categories with different behaviors.

## Core Design Principle

**Settings changes should behave like a coach adjusting the plan.**

- Small changes → small adjustments (no new version)
- Major changes → structured regeneration (new version)

The athlete should feel that their progress and context are respected.

---

## Change Classification

### Minor Adjustments

These modifications affect future sessions **without** generating a new ProgramVersion:

| Field | Threshold | Impact |
|-------|-----------|--------|
| Session Duration | ±15 minutes | Session pacing and accessory work adjust |
| Weakest Area | Any change | Programming emphasis shifts |
| Experience Level | Any change | Progression timeline estimates update |
| Bodyweight | Any change | Intensity calculations adjust |
| Minor Equipment | Non-essential | Exercise variants substitute |

**Behavior:**
- No new ProgramVersion created
- Session adaptations recorded to database
- Future session generation reads adaptations
- Coaching message: "Settings updated" tone

### Structural Changes

These modifications **require** a new ProgramVersion:

| Field | Trigger | Reason |
|-------|---------|--------|
| Training Days/Week | Any change | `settings_schedule_change` |
| Session Duration | >15 minutes | `settings_schedule_change` |
| Primary Goal | Any change | `settings_goal_change` |
| Training Style | Any change | `settings_style_change` |
| Major Equipment | bars, rings, dip bars, weight belt | `settings_equipment_change` |
| Joint Cautions | Any added/removed | `injury_status_change` |

**Behavior:**
- New ProgramVersion created
- Previous version marked `superseded`
- Input snapshot captured
- Coaching message: "Program updated" tone

---

## Data Flow

```
┌─────────────────────┐
│   Settings Page     │
│   (UI Changes)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PUT /api/settings  │
│  (API Endpoint)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ analyzeSettings     │
│ Changes()           │
│ (Classification)    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────┐
│ Minor   │  │Structural│
│ Change  │  │ Change   │
└────┬────┘  └────┬─────┘
     │            │
     ▼            ▼
┌─────────┐  ┌──────────┐
│ Record  │  │ Create   │
│ Session │  │ New      │
│Adaptation│  │ Version  │
└────┬────┘  └────┬─────┘
     │            │
     └─────┬──────┘
           │
           ▼
┌─────────────────────┐
│  Return Response    │
│  with Coaching Msg  │
└─────────────────────┘
```

---

## Systems That Are NEVER Reset

The following are **preserved across all settings changes**:

| System | Purpose |
|--------|---------|
| `skill_state` | Skill progression memory |
| `skill_readiness` | Strength/weakness tracking |
| `workout_logs` | Training history |
| `fatigue_tracking` | Recovery state |
| `strength_records` | PR tracking |
| `readiness_history` | Historical snapshots |

---

## Systems That MAY Be Updated

| System | When Updated |
|--------|--------------|
| `program_version` | Structural changes only |
| `future_sessions` | All changes |
| `exercise_pool` | Equipment changes |
| `session_structure` | Duration/style changes |
| `weekly_structure` | Frequency changes |

---

## ProgramVersion Integrity

### Guarantees

1. **Only one active version** per athlete at any time
2. **Version history preserved** - previous versions marked `superseded`
3. **Workout logs tied** to their original version
4. **Input snapshots captured** for reproducibility

### Version Creation

```typescript
// When structural change detected:
1. Archive current active version
2. Create new ProgramVersion
3. Capture input snapshot
4. Set new version as active
5. Mark regeneration timestamp (debounce)
```

### Debounce Protection

- 5-second cooldown between regenerations
- Prevents rapid duplicate regenerations
- `canRegenerate()` / `markRegeneration()` functions

---

## Session Adaptations

For minor changes, session adaptations are recorded:

```sql
INSERT INTO session_adaptations (
  athlete_id,
  program_version_id,
  adaptation_type,    -- 'pacing' | 'emphasis' | 'intensity' | 'substitution'
  description,
  expires_at          -- NULL = permanent until version changes
)
```

Session generation reads active adaptations and adjusts accordingly.

---

## Coaching Messages

### Structural Change Messages

| Reason | Message |
|--------|---------|
| `settings_goal_change` | "Your program was restructured for your new skill focus." |
| `settings_schedule_change` | "Your program was updated to match your new training schedule." |
| `settings_equipment_change` | "Your program was adjusted for your equipment changes." |
| `settings_style_change` | "Your training approach has been updated." |
| `injury_status_change` | "Your program was adjusted for your joint status." |

### Minor Change Messages

- "Your settings were updated."
- "[Specific impact description]"

---

## API Endpoints

### GET /api/settings

Returns current profile and active program version info.

### PUT /api/settings

Updates profile and handles regeneration intelligently.

**Request:**
```json
{
  "trainingDaysPerWeek": 4,
  "sessionLengthMinutes": 60,
  "primaryGoal": "front_lever",
  "equipmentAvailable": ["pullup_bar", "dip_bars"],
  "jointCautions": [],
  "trainingStyle": "skill_focused"
}
```

**Response:**
```json
{
  "success": true,
  "profile": { ... },
  "analysis": {
    "overallCategory": "structural",
    "requiresRegeneration": true,
    "changes": [...],
    "coachingMessage": "Your program was restructured..."
  },
  "regenerated": true,
  "versionMessage": "...",
  "preservedSystems": ["skill_state", "workout_logs", ...]
}
```

---

## Files

| File | Purpose |
|------|---------|
| `lib/settings-regeneration-service.ts` | Change classification logic |
| `lib/program-version-service.ts` | Version management |
| `app/api/settings/route.ts` | API endpoint |
| `app/settings/page.tsx` | UI integration |
| `scripts/006-settings-regeneration-schema.sql` | Database schema |

---

## Example Scenarios

### Scenario 1: User reduces session length by 10 minutes

- **Classification:** Minor (within ±15 min threshold)
- **Action:** Record session adaptation (type: pacing)
- **Result:** Future sessions have reduced accessory work
- **Message:** "Session pacing will adjust slightly"

### Scenario 2: User changes primary goal from Front Lever to Planche

- **Classification:** Structural
- **Action:** Create new ProgramVersion
- **Result:** Program refocused on Planche
- **Preserved:** All Front Lever SkillState and readiness
- **Message:** "Your program was restructured for your new skill focus."

### Scenario 3: User adds joint caution for shoulders

- **Classification:** Structural
- **Action:** Create new ProgramVersion
- **Result:** Exercises modified to protect shoulders
- **Message:** "Your program was adjusted for your joint status."

### Scenario 4: User removes resistance bands (minor equipment)

- **Classification:** Minor
- **Action:** Record session adaptation (type: substitution)
- **Result:** Exercise variants substitute
- **Message:** "Some exercises will be substituted"

---

## Validation Checklist

- [x] Minor changes update future sessions only
- [x] Major changes create new ProgramVersion
- [x] SkillState remains preserved
- [x] Readiness calculations remain correct
- [x] Next Workout reflects updated program
- [x] No duplicate active programs exist
- [x] Program history remains intact
- [x] Debounce prevents rapid regeneration
- [x] Coaching messages are clear and professional
