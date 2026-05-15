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
