# Testing Checklist - SpartanLab Engine Fixes

Use this checklist to validate that the engine fixes are working correctly. Test against the canonical user profile:

- Advanced athlete
- Primary goal: Planche  
- Secondary goal: Front Lever
- Pull-ups: 18-22
- Weighted pull-up: 25 x 5
- Dips: 21-25
- Weighted dip: 40 x 5
- Selected skills: planche, front lever, handstand, HSPUs
- Equipment: pull bar, dip bars, parallettes, bands
- Joint cautions: shoulders, elbows, wrists

---

## TASK 1: Canonical Profile Consumption

### Test: View Program Page
**Expected:** Program reflects saved onboarding data

- [ ] Primary goal shows as "Planche"
- [ ] Secondary goal section visible showing "Front Lever"
- [ ] Session count reflects user's flexible schedule preference
- [ ] Session length matches user's preference (longer sessions)
- [ ] Equipment list includes user's saved equipment

**Verification logs:**
- Check browser console for `[program-gen] Inputs:` log
- Verify `secondaryGoal: "front_lever"` appears
- Check `[CanonicalProfile]` log shows all benchmark fields

---

## TASK 2: Secondary Goal Influence on Structure

### Test: Check Weekly Structure
**Expected:** Secondary goal allocates dedicated day

**For 3-day/4-day/5-day structure:**
- [ ] Day 1: Primary skill focus (Planche/Push)
- [ ] Day 2: **Secondary skill focus** (Front Lever/Pull) - NOT generic support
- [ ] Day 3+: Remaining structure as designed
- [ ] Rationale mentions both "planche" and "front lever"

**Example 4-day structure should show:**
```
Day 1: Push Skill (Planche) - Primary
Day 2: Pull Skill (Front Lever) - Secondary  ← Changed from support
Day 3: Push Strength  
Day 4: Mixed Skills
```

**Verification:**
- Check program display for day labels
- Look for "Front Lever" or "Pull Skill" on Day 2
- Read the rationale/explanation text

---

## TASK 3: Limiter Logic Based on Canonical Data

### Test: View Current Limiter Section
**Expected:** Limiter based on real benchmarks + goal demands

- [ ] Limiter description is **specific** to the user (not generic template)
- [ ] For advanced user (18+ pull-ups, 40lb weighted dip), expect something like:
  - "Skill coordination" (if both pull and push are strong)
  - OR "Pulling strength" (if pull < push + 10, considering FL secondary)
- [ ] Limiter explanation references actual saved benchmarks
- [ ] Does NOT show placeholder text or generic fallback

**Bad Example (Template-driven):**
```
"You need to build pulling strength"
```

**Good Example (Data-driven):**
```
"Pulling strength relative to planche demands supports both your planche 
progression and front lever secondary goal. Current capacity: 18 pull-ups, 
25lb weighted. Target: 22+ pull-ups for advanced planche support."
```

**Verification logs:**
- Check `[WeakPointDetection] TASK 3 - Using unified benchmarks:` log
- Verify pullScore, pushScore, flexScore are calculated
- Check `[WeakPointDetection] TASK 3 - Calculated scores:` shows real values

---

## TASK 4: Progression-Aware Warm-Ups

### Test: View Warm-Up Section
**Expected:** Warm-up includes skill-specific progression prep

**For Planche session:**
- [ ] Warm-up includes: Wrist Prep
- [ ] Warm-up includes: Scapular Push-Ups
- [ ] Warm-up includes: Planche Leans (if tuck+ progression)
- [ ] Warm-up includes: Support Hold
- [ ] User-preferred exercises present: Arm Circles, Arm Swings
- [ ] Rationale mentions "planche" or "wrist" or "scapular protraction"

**For Front Lever session:**
- [ ] Warm-up includes: Lat Stretches
- [ ] Warm-up includes: Scapular Pull-Ups
- [ ] Warm-up includes: Dead Hang
- [ ] Warm-up includes: Tuck FL Raises (if straddle+ progression)
- [ ] User-preferred exercises present: Trunk Rotations, Toe Touch Pulses
- [ ] Rationale mentions "front lever" or "lat" or "scapular depression"

**Bad Example (Template warm-up):**
```
1. Arm Circles
2. Wrist Prep
3. Random accessory
```

**Good Example (Progression-aware):**
```
1. Arm Circles (user preferred)
2. Wrist Prep (skill demand)
3. Scapular Push-Ups (planche prep)
4. Planche Leans (progression ramp)
5. Support Hold (shoulder prep)

Rationale: "Progressive prep for advanced planche: wrist/scap 
activation → lean exposure → skill work"
```

**Verification logs:**
- Check `[program-gen] Secondary goal influence:` shows isPullSecondary, isPushSecondary
- Look for warm-up being called with firstSkillProgression
- Verify skill type (planche, front_lever) detected from first main exercise

---

## TASK 5: Session Composition Quality

### Test: Compare Across Sessions
**Expected:** Exercises don't repeat mechanically

- [ ] Push sessions have varied push exercise selections
- [ ] Pull sessions have varied pull exercise selections
- [ ] Planche sessions don't use identical accessory patterns
- [ ] Front lever sessions show progression variety
- [ ] Each day feels purposeful and different from previous day

**Verification:**
- Manually compare main exercises across 3-4 sessions
- Look for creative exercise variation within same focus
- Check that beneficial patterns repeat with variation (not identical)

---

## TASK 6: Program Explanations Match Engine Logic

### Test: Read Explanation Sections
**Expected:** All copy reflects actual generation logic

- [ ] "Why this plan" section mentions **both** primary and secondary goal
- [ ] Schedule explanation accurate (e.g., "Flexible mode: 4 sessions planned")
- [ ] Limiter explanation matches actual limiter logic shown
- [ ] Coaching message is specific to user profile (not generic)
- [ ] Experience level matches user's actual level

**Bad Example:**
```
"This is a strength-focused program for your training."
(doesn't mention secondary goal, generic phrasing)
```

**Good Example:**
```
"Planche primary skill training with secondary emphasis on front lever 
development. Flexible mode: 4 sessions planned. Your limiter is pulling 
strength relative to planche demands plus front lever secondary goals."
```

---

## TASK 7: Flexible Schedule Preserved

### Test: Check Schedule Settings
**Expected:** Flexible schedule still works correctly

- [ ] Program shows as "Flexible" (not converted to static)
- [ ] Current week resolves to correct session count
- [ ] Changing recovery state updates week frequency correctly
- [ ] Session length preferences still respected
- [ ] Can manually adjust training days if needed

**Verification:**
- Check program metadata for `scheduleMode: "flexible"`
- Verify program has `trainingDaysPerWeek` field (not `trainingDays`)
- Confirm can navigate between different week frequencies

---

## TASK 8: Onboarding Data Really Drives Output

### Test: Modify User Profile and Regenerate
**Expected:** Changing canonical profile changes output

1. **Change Primary Goal:**
   - Save Front Lever as primary, Planche as secondary
   - Regenerate program
   - [ ] Day 1 becomes Pull Skill (Front Lever)
   - [ ] Rationale reverses (Front Lever first)

2. **Change Secondary Goal:**
   - Remove secondary goal (set to None)
   - Regenerate program
   - [ ] Day 2 becomes "Pull/Push Support" (back to single-goal structure)
   - [ ] Rationale no longer mentions secondary

3. **Change Benchmarks:**
   - Modify weighted pull-up from 25 to 45
   - Regenerate program
   - [ ] Limiter changes (advanced athlete detection kicks in)
   - [ ] Explanation updates to acknowledge higher capacity

4. **Change Schedule:**
   - Modify from flexible to static 3 days/week
   - Regenerate program
   - [ ] Structure changes to 3-day layout
   - [ ] Explanation reflects 3 sessions vs flexible

---

## TASK 9: Preserved Working Chains

### Test: Full User Journey
**Expected:** App functionality unchanged except engine outputs

1. **Start Workout Flow:**
   - [ ] "Start Workout" button works normally
   - [ ] First session loads correctly
   - [ ] Can navigate to workout execution

2. **Workout Session Execution:**
   - [ ] Session displays correctly with exercises
   - [ ] Can complete exercises normally
   - [ ] Can input reps/weight
   - [ ] Can rest between sets
   - [ ] Can finish session

3. **Settings Save/Load:**
   - [ ] Can save profile changes
   - [ ] Changes persist on page reload
   - [ ] Can update benchmarks
   - [ ] Can regenerate program from settings

4. **History & Analytics:**
   - [ ] History page shows completed workouts
   - [ ] Metrics display correctly
   - [ ] Previous programs visible

---

## Quick Regression Tests

### Does NOT Break:
- [ ] Navigation between pages works
- [ ] Responsive layout intact on mobile
- [ ] Session history loads
- [ ] User can log out/in
- [ ] Stripe billing (if applicable)
- [ ] Authentication flow

---

## Developer Verification

### Check Logs in Browser Console:

```javascript
// Should see these logs when generating program:
[program-gen] Inputs: {...}
[program-gen] Secondary goal influence: {...}
[program-gen] Using canonical profile: {...}
[AdaptiveBuilder] getDefaultAdaptiveInputs consumed from CANONICAL: {...}
[WeakPointDetection] TASK 3 - Using unified benchmarks: {...}
[WeakPointDetection] TASK 3 - Calculated scores: {...}
[CanonicalProfile] program generation: {...}
```

### Check Network Tab:
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] Database queries working normally

---

## Sign-Off Checklist

- [ ] All 9 tasks working correctly
- [ ] Program structure matches secondary goal
- [ ] Warm-up is progression-aware
- [ ] Limiter is data-driven
- [ ] Explanations are specific
- [ ] Flexible schedule works
- [ ] No session breakage
- [ ] Responsive design intact
- [ ] Browser console clean of errors
- [ ] Ready for production

