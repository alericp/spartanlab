# MASTER-8C.3 Bulk Science Coverage Report

## Summary

- **Previous full science count:** 38 exercises
- **New full science count:** 72 exercises
- **Entries added:** 34 new entries
- **TypeScript:** PASSED
- **Build:** PASSED

## Added Exercise IDs by Segment

### Segment A: Current-Program Gaps + High-Priority Generated Exercises (22 entries)

1. `push_up` - Standard Push-Up
2. `diamond_pushup` - Diamond Push-Up
3. `archer_push_up` - Archer Push-Up
4. `scap_pushup` - Scapular Push-Up
5. `bodyweight_row` - Bodyweight Row / Inverted Row
6. `ring_row` - Ring Row
7. `ring_row_elevated` - Ring Row Feet Elevated
8. `typewriter_pull_up` - Typewriter Pull-Up
9. `wall_hspu_partial` - Wall HSPU Partial ROM
10. `wall_hspu_full` - Wall HSPU Full Range
11. `wall_hspu_negative` - Wall HSPU Negative / Eccentric
12. `deficit_hspu` - Deficit HSPU
13. `freestanding_hs_hold` - Freestanding Handstand Hold
14. `strict_muscle_up` - Strict Muscle-Up
15. `ring_muscle_up` - Ring Muscle-Up
16. `muscle_up_transition_drill` - Muscle-Up Transition Drill
17. `ice_cream_maker` - Ice Cream Maker (FL dynamic)
18. `one_leg_fl` - One-Leg Front Lever
19. `straddle_fl` - Straddle Front Lever
20. `hanging_l_sit` - Hanging L-Sit
21. `v_sit_progression` - V-Sit Progression
22. `v_sit_hold` - V-Sit Hold

### Segment B: Dragon Flag / Core Progressions (5 entries)

1. `dragon_flag_tuck` - Tuck Dragon Flag
2. `dragon_flag_neg` - Dragon Flag Negative
3. `hollow_body_rock` - Hollow Body Rock
4. `arch_body` - Arch Body Hold
5. `toes_to_bar` - Toes to Bar

### Segment C: Support / Prehab / Warm-up / Cooldown / Mobility (7 entries)

1. `dead_hang` - Dead Hang
2. `active_hang` - Active Hang
3. `support_hold_dip_negative` - Support Hold to Dip Negative
4. `ring_support_hold` - Ring Support Hold
5. `wrist_circles` - Wrist Circles
6. `pike_stretch` - Pike Stretch
7. `pancake_stretch` - Pancake Stretch

## Coverage Impact

### Current-Program Coverage (Expected)

- **Before:** Full Science 14 / Need Science 7
- **After:** Should increase Full Science and decrease Need Science for any current-program exercises that match the newly added IDs

### App Pool Coverage

- **App Pool:** ~129 exercises
- **Full Science DB:** 72 exercises (55.8% coverage)
- **Remaining gap:** ~57 exercises

## Taxonomy Distinctions Preserved

- `wall_hspu_partial` vs `wall_hspu_full` vs `wall_hspu_negative` - distinct ROM/type
- `push_up` vs `diamond_pushup` vs `archer_push_up` - distinct difficulty/pattern
- `bodyweight_row` vs `ring_row` vs `ring_row_elevated` - distinct equipment/difficulty
- `strict_muscle_up` vs `ring_muscle_up` vs `muscle_up_transition_drill` - distinct variants
- `dragon_flag_tuck` vs `dragon_flag_neg` - distinct progressions
- `dead_hang` vs `active_hang` - distinct engagement level
- All holds use `seconds` and `isIsometric: true`
- All dynamic reps use `reps` and `isIsometric: false`

## Files Changed

1. `lib/program/exercise-skill-knowledge-seed.ts` - Added 34 new ExerciseSkillKnowledgeEntry records

## Files Intentionally Not Touched

- `components/programs/AdaptiveProgramDisplay.tsx`
- Program card renderers
- Live workout runtime files
- `components/workout/*`
- `app/(app)/workout/*`
- `app/(app)/program/page.tsx`
- Generator/builder files
- Method Planner files
- Schema files
- Package files
- Auth/billing/Stripe/Clerk files

## Confirmations

- [x] Generator behavior unchanged
- [x] Program Balance remains read-only
- [x] Program Cards not changed
- [x] Live Workout not changed
- [x] No schema changes
- [x] No package changes
- [x] No duplicate exercise IDs
- [x] All entries satisfy ExerciseSkillKnowledgeEntry type
- [x] TypeScript passes
- [x] Build passes

## Remaining DB Coverage Gap

~57 exercises remain uncovered in the app pool. Priority for MASTER-8C.4:

- Additional mobility/warm-up exercises
- Remaining planche progressions (`straddle_planche`)
- Additional compression work (`compression_pulse`, `seated_leg_lift`, `straddle_compression_lift`)
- Additional row/pull variations (`one_arm_row_progression`)
- Remaining L-sit variations (`single_leg_l_sit`, `advanced_l_sit`, `l_sit_core`)

## Recommended Next Step

**MASTER-8C.4** — Continue DB expansion for remaining high-priority exercises and/or Generator Consumption Audit Gate, depending on whether current-program coverage reaches full-science.

## Truly Unknown Current-Program Exercise

If the user's current program contains 1 exercise "not found in any app source," this is NOT covered by the science DB expansion. It requires either:
1. Adding the exercise to the app pool first
2. Mapping via alias if it's a naming variant of an existing exercise
3. Documenting as a truly external/custom exercise
