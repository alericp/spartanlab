# MASTER METHOD SYSTEM — FUTURE DOCTRINE QUEUE

Created: MASTER-8C.4.G
Purpose: Track deferred method system capabilities that need future implementation.

---

## A. Conditioning Finisher Future Engine

### 1. Contract / Representation Layer
- [ ] Distinguish method artifact from real exercise
- [ ] Define finisher modality (row, bike, jump rope, bodyweight circuit, etc.)
- [ ] Define time cap (5-8 min standard, adjustable)
- [ ] Define intensity target (RPE 5-7 for low-moderate)
- [ ] Define work/rest pattern (continuous vs interval)
- [ ] Define equipment requirement per modality

### 2. Read-Only Proof Layer
- [ ] Show why finisher is allowed/blocked based on:
  - Recovery state
  - User goals
  - Session stress accumulation
  - Skill work volume in session
  - Equipment availability
  - Onboarding data

### 3. Generator Materialization Layer
- [ ] Select real finisher modality/exercises safely
- [ ] Avoid repeated templates across multiple finisher days
- [ ] Adapt to user goals (fat loss vs muscle building vs general fitness)
- [ ] Respect fatigue state
- [ ] Respect skill priority (don't exhaust before skill work)
- [ ] Respect equipment availability

### 4. Program Page Display Layer
- [ ] Show time-based prescription honestly
- [ ] No fake sets/reps if time-capped
- [ ] Show selected modality when materialized
- [ ] Show intensity guidance

### 5. Live Workout Runtime Layer
- [ ] Support timer for time-capped work
- [ ] Support interval/AMRAP/circuit mode
- [ ] Logging that matches prescription (duration, rounds, etc.)

---

## B. Density Block Future Runtime/Logging Repair

### 1. Contract / Representation Layer
- [ ] Distinguish density block from circuit
- [ ] Define time cap (e.g., 10-12 min)
- [ ] Define AMRAP target (rounds or reps)
- [ ] Define quality constraints (stop rules)
- [ ] Define exercise-specific prescription within block

### 2. Read-Only Proof Layer
- [ ] Show why density was chosen
- [ ] Show why exercises fit the athlete
- [ ] Show why time window is appropriate

### 3. Program Page Display Layer
- [ ] Show exact time cap
- [ ] Show clean execution instructions
- [ ] Show round/rep targets

### 4. Live Workout Runtime Layer
- [ ] Timer-aware logging
- [ ] AMRAP/round tracking
- [ ] Quality-based stop rules
- [ ] No fake fixed straight-set logging if density semantics require timed work

---

## Implementation Priority Order

1. Conditioning Finisher — Contract layer (method artifact classification) ✅ DONE in MASTER-8C.4.G
2. Conditioning Finisher — Read-only proof layer
3. Conditioning Finisher — Generator materialization layer
4. Conditioning Finisher — Program Page display layer
5. Conditioning Finisher — Live Workout runtime layer
6. Density Block — Contract layer
7. Density Block — Read-only proof layer
8. Density Block — Program Page display layer
9. Density Block — Live Workout runtime layer

---

## Related MASTER Steps

- MASTER-8C.4.G: Method artifact classification foundation (current)
- MASTER-8C.5: Generator / Restart Program DB Consumption Gate
- Future: Conditioning finisher decision engine
- Future: Density block logging repair

---

## C. Method Override Frequency, User Agency, Slot Ownership, and Scientific Method Application

### 1. Requested Method Frequency System
- [ ] Each method override should support requested weekly frequency:
  - 1x/week
  - 2x/week
  - 3x/week
  - up to actual training days/week
- [ ] Requested method frequency must be capped by actual generated training days
  - Example: if program has 3 training days, user cannot apply a method 4 times that week
- [ ] Method application must NOT be simple counting logic
  - BAD: 1 application = low risk, 2 = moderate, 3 = high
  - GOOD: compute risk from session stress, movement overlap, method compatibility, exercise slots, skill demand, fatigue, recovery, tendon load, training phase, and next-session impact

### 2. Optimal Slot Selection
- [ ] Each additional method application must choose the next most optimal available location
- [ ] Do NOT reuse the same slot for multiple method applications
- [ ] Consider day placement, exercise compatibility, and weekly stress distribution

### 3. User Agency with Safety Warnings
- [ ] If user wants circuits 6 days/week, system should:
  - Warn strongly with clear risk explanation
  - Compute actual risk from all relevant factors
  - Recommend safer alternatives (e.g., circuits + supersets + density mix)
  - Preserve user agency if user insists after seeing warnings
- [ ] Concise notification when AI recommends plan changes:
  - What changed
  - Why
  - Evidence
  - Affected days
  - Accept / Decline buttons

### 4. Exercise Slot Ownership
- [ ] Exercise slots must be treated as owned resources:
  - Circuit consumes multiple exercises
  - Superset consumes two exercises
  - Top set/backoff consumes one exercise
  - Drop set consumes one exercise
  - Density block consumes a time/work window
  - Finisher consumes end-of-session conditioning time and recovery budget
- [ ] Once all eligible slots are consumed, additional methods must be blocked as "no room / no safe target"
- [ ] Do NOT apply methods by adding random exercises or days

### 5. Advanced Adaptiveness (Future)
- [ ] May recommend changing training days/frequency, but only through user-confirmed mutation
- [ ] Detailed proof in Coach Intelligence surfaces
- [ ] Workout-start notifications summarize key reason clearly

### 6. Scientific Method Contracts
Each method needs a comprehensive contract defining:
- [ ] **Circuits**
- [ ] **Supersets**
- [ ] **Density Blocks**
- [ ] **Top Set + Backoff**
- [ ] **Drop Sets**
- [ ] **Rest-Pause**
- [ ] **Cluster Sets**
- [ ] **Conditioning Finishers**

### 7. Method Contract Requirements
Each method contract must eventually define:
- Best use case
- Bad use case
- Compatible exercise types
- Incompatible exercise types
- Fatigue cost
- Tendon/joint risk
- Technical-quality risk
- Session-placement rules
- Weekly-frequency tolerance
- Progression/regression behavior
- UI/logging semantics
- Live workout execution model

### 8. Implementation Layered Order
1. Foundation contracts first (method definitions, slot ownership, risk models)
2. Read-only proof second (why method was chosen/blocked)
3. Program Page materialization third (visible method application)
4. Controlled apply/mutation fourth (safe method application with user confirmation)
5. Live Workout runtime/logging fifth (timer, rounds, AMRAP, quality tracking)

---

## D. Generator DB Consumption Foundation (MASTER-8C.5)

### Status: IMPLEMENTED

The generator/selector now consumes the exercise knowledge foundation:
- [x] `exercise-knowledge-generator-bridge.ts` created
- [x] `NormalizedExerciseCandidate` extended with knowledge fields
- [x] `normalizeExerciseCandidate()` enriches with knowledge data
- [x] `ExerciseSelection` includes `knowledgeConsumptionSummary`
- [x] All exercises are enriched with:
  - Movement balance families
  - Tissue stress regions
  - Training purposes
  - Skill transfer targets
  - Method compatibility verdicts
  - Prescription unit truth
  - Frequency tolerance
  - Training cost breakdown

### Future Enhancements
- [ ] Use knowledge for scoring influence in candidate selection
- [ ] Use method compatibility for method application decisions
- [ ] Use tissue stress for recovery-aware scheduling
- [ ] Use prescription unit truth to prevent hold/rep confusion
