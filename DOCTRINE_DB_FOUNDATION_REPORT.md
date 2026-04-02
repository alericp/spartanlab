# Doctrine DB Foundation Report

**Phase:** Doctrine DB Foundation Audit and Wiring
**Date:** Phase Completion Report
**Status:** Foundation Created, Not Yet Wired to Generator

---

## 1. What Currently Drives Generation Today

| Source | Type | Currently Used by Generator | Notes |
|--------|------|----------------------------|-------|
| `DOCTRINE_REGISTRY` | Code Registry | Available but NOT actively called | 4 rich doctrines defined |
| `METHOD_PROFILES` | Code Registry | YES - shapes session structure | 7 method profiles |
| `SKILL_SUPPORT_MAPPINGS` | Code Registry | YES - informs support selection | Rich prerequisite data |
| Canonical Profile Service | DB + Code | YES - primary athlete truth | All athlete-specific decisions |
| Adaptive Exercise Pool | Code Registry | YES - exercise selection | 129 exercises with metadata |

**The generator currently uses code-based registries for doctrine decisions, NOT a queryable database.**

---

## 2. What is Code-Only Today

| Registry | File Path | Contents |
|----------|-----------|----------|
| `DOCTRINE_REGISTRY` | `lib/training-doctrine-registry/doctrineRegistry.ts` | 4 training philosophies (static_skill_frequency, weighted_strength_conversion, endurance_density, tendon_conservative) |
| `METHOD_PROFILES` | `lib/doctrine/method-profile-registry.ts` | 7 method profiles with slot weighting, structure guidance, tendon management |
| `SKILL_SUPPORT_MAPPINGS` | `lib/doctrine/skill-support-mappings.ts` | Prerequisites, support patterns, limiting factors for front_lever, back_lever, planche, hspu, etc. |

---

## 3. What is DB-Backed Today

| Table | Purpose | Status |
|-------|---------|--------|
| `athlete_profiles` | User profile data | Active - used |
| `programs` | Generated program snapshots | Active - used |
| `skill_progressions` | User skill tracking | Active - used |
| `skill_readiness` | Readiness assessments | Active - used |
| `performance_envelopes` | Volume/intensity calibration | Active - used |
| `training_doctrine_sources` | Doctrine sources | **NEW - Created this phase** |
| `training_doctrine_principles` | Training principles | **NEW - Created this phase** |
| `progression_rules` | Progression logic | **NEW - Created this phase** |
| `exercise_selection_rules` | Exercise selection rules | **NEW - Created this phase** |
| `exercise_contraindication_rules` | Safety rules | **NEW - Created this phase** |
| `method_rules` | Method profiles | **NEW - Created this phase** |
| `prescription_rules` | Rep/set/rest guidance | **NEW - Created this phase** |
| `skill_carryover_rules` | Transfer rules | **NEW - Created this phase** |

---

## 4. Whether PDFs Are Actually Readable by the App Today

**NO.**

- There is NO PDF ingestion pipeline
- There is NO vector/embedding store
- There is NO RAG retrieval system
- ChatGPT memory and uploaded PDFs are NOT accessible to SpartanLab

**Explicit Statement:**
> ChatGPT memory, uploaded PDFs, and previous conversation context are NOT automatically usable by SpartanLab unless explicitly extracted and stored in an app-readable structure that the builder queries. No such system currently exists.

---

## 5. Whether Doctrine DB Foundation Now Exists

**YES - Created This Phase**

### New Database Tables Created:
1. `training_doctrine_sources` - Master table for doctrine origins
2. `training_doctrine_principles` - Core training principles
3. `progression_rules` - Skill progression logic
4. `exercise_selection_rules` - Exercise selection rules
5. `exercise_prerequisite_rules` - Exercise prerequisites
6. `exercise_contraindication_rules` - Safety contraindications
7. `method_rules` - Training method profiles
8. `skill_carryover_rules` - Transfer/carryover rules
9. `prescription_rules` - Rep/set/rest guidance
10. `doctrine_rule_versions` - Version tracking

### New Access Layer Created:
- `lib/doctrine-db.ts` - Safe read-only database access
- `lib/doctrine-query-service.ts` - Higher-level query interface
- `lib/doctrine-runtime-readiness.ts` - Readiness check utility
- `app/api/audit/doctrine-db/route.ts` - Audit API endpoint

### Seed Data Created:
- 1 system-seeded doctrine source
- 7 core training principles
- 5 progression rules (planche, front lever)
- 4 exercise selection rules
- 4 contraindication rules
- 3 method rules
- 3 prescription rules
- 5 carryover rules

---

## 6. Whether Doctrine DB is Currently Being Used by Generation

**NO - Not Yet Wired**

The doctrine database foundation has been created with:
- Tables
- Seed data
- Read-only access layer
- Query service
- Readiness check
- Audit API

However, the **adaptive program builder does NOT yet call the doctrine DB**. This is intentional for this phase - we created the foundation without changing generator behavior.

---

## 7. What the Next Safe Phase Should Be

### Phase 3: Doctrine DB Generator Integration

1. **Wire `selectDoctrinesForAthlete()` into builder**
   - Call from `adaptive-program-builder.ts` at generation start
   - Select appropriate doctrines based on athlete profile
   
2. **Apply doctrine principles to exercise selection**
   - Query relevant principles for athlete's goal/level
   - Weight exercise selection based on doctrine guidance
   
3. **Apply progression rules from DB**
   - Use DB progression rules alongside code-based logic
   - Respect caution flags from DB

4. **Apply contraindication rules from DB**
   - Cross-check joint cautions against DB rules
   - Apply modification guidance when appropriate

5. **Apply prescription rules from DB**
   - Use DB-backed rep/set/rest guidance
   - Apply RPE guidance based on level/goal

---

## Summary Table

| Question | Answer |
|----------|--------|
| Is SpartanLab builder code-driven or DB-driven? | **Primarily CODE-DRIVEN for doctrine** |
| Does the app have a structured doctrine DB? | **YES - Created this phase** |
| Can the app read PDFs/memory automatically? | **NO** |
| Are existing code registries substantial? | **YES - 4 doctrines, 7 method profiles, 10+ skill mappings** |
| Is Neon capable of holding full doctrine system? | **YES** |
| What missing layer prevented deep coaching behavior? | **Doctrine DB not wired to generator** |
| What is the safest next phase? | **Wire doctrine DB into generator** |

---

## Files Created This Phase

| File | Purpose |
|------|---------|
| `scripts/012-doctrine-foundation-schema.sql` | Database schema migration |
| `scripts/013-doctrine-foundation-seed.sql` | Seed data migration |
| `lib/doctrine-db.ts` | Database access layer |
| `lib/doctrine-query-service.ts` | Query service |
| `lib/doctrine-runtime-readiness.ts` | Readiness check |
| `app/api/audit/doctrine-db/route.ts` | Audit API |
| `DOCTRINE_DB_FOUNDATION_REPORT.md` | This report |

---

## Audit API Endpoint

Access the doctrine DB audit at:
```
GET /api/audit/doctrine-db
```

Returns comprehensive JSON showing:
- Table existence
- Row counts
- Code vs DB comparison
- Readiness status
- Next steps

---

## Final Status

**FOUNDATION COMPLETE - READY FOR WIRING PHASE**
