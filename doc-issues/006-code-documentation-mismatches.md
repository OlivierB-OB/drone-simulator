# Issue 006: Code-Documentation Mismatches

## Severity
**MEDIUM** - Risk of incorrect implementation based on outdated documentation

## Summary
Documentation contains technical details that could drift from actual code implementation over time. Some specific facts need periodic verification to ensure readers have accurate information.

## Items Requiring Verification

### 1. Terrarium RGB Formula
**Location**: `doc/data/elevations.md` (lines ~113-115)

**Documented formula**:
```
elevation = (R × 256 + G + B/256) - 32768
```

**Where to verify**: `src/data/elevation/ElevationDataTileParser.ts` (line 113)

**Verification checklist**:
- [ ] Implementation uses exact formula documented
- [ ] Constant offset (-32768) is correct
- [ ] Red/Green/Blue channel usage matches documentation
- [ ] Example values (RGB(128,0,0) = 0m, RGB(162,144,0) = 8848m) are mathematically correct

### 2. Animation Frame Order
**Location**: `doc/animation-loop.md` (complete 9-step sequence)

**Where to verify**:
- `src/App.tsx`: Main animation loop orchestration
- `src/core/AnimationLoop.ts`: requestAnimationFrame hook implementation
- `src/drone/Drone.ts`: Movement/update logic
- Related data managers and mesh factories

**Verification checklist**:
- [ ] Step 1 (drone.applyMove) is always first
- [ ] Steps 2-3 (tile loading) happen after movement
- [ ] Steps 4-6 (mesh creation) follow tile loading
- [ ] Step 7 (rendering) is final
- [ ] Event subscription order matches documented sequence
- [ ] No additional steps omitted from documentation

### 3. Cache TTL Values
**Location**: Multiple files document "24-hour TTL"
- `doc/data/elevations.md` (line 82)
- `doc/data/contextual.md` (line 123)
- `doc/tile-ring-system.md` (line 407)

**Where to verify**:
- Elevation cache implementation (check TTL_HOURS constant)
- Context cache implementation (check TTL_HOURS constant)
- IndexedDB persistence configuration

**Verification checklist**:
- [ ] Both caches use 24-hour TTL
- [ ] TTL_HOURS constant = 24 in both implementations
- [ ] No environment-specific variations
- [ ] Cache invalidation logic matches documented behavior

### 4. Tile Ring Configuration
**Location**: Multiple references (See Issue 001)

**Where to verify**: `src/config.ts`

**Verification checklist**:
- [ ] Parameter name is consistent (ringRadius vs tileRing)
- [ ] Default value matches documentation
- [ ] Configuration is used by ElevationDataManager and ContextDataManager
- [ ] Related constants (maxConcurrentLoads, etc.) match documented values

### 5. Web Mercator Tile Dimensions
**Location**: Multiple files reference 256×256 pixel tiles

**Where to verify**: Code that fetches and processes tiles

**Verification checklist**:
- [ ] All tile operations assume 256×256 pixels
- [ ] Zoom levels and tile indexing match Web Mercator standard
- [ ] Mercator Y axis increases northward (not southward)

### 6. Coordinate System Transformation
**Location**: `doc/coordinate-system.md` (comprehensive section)

**Where to verify**: All components using coordinate transformation
- `src/gis/types.ts`: mercatorToThreeJs() function
- `src/visualization/terrain/TerrainObjectFactory.ts`: Z negation usage
- `src/visualization/objects/BuildingMeshFactory.ts`: Z negation usage
- `src/3Dviewer/Camera.ts`: Camera positioning

**Verification checklist**:
- [ ] Z = -mercatorY in all components
- [ ] No inconsistent coordinate transforms
- [ ] Movement calculations use correct azimuth formula
- [ ] Camera lookAt uses correct positioning

## Verification Process

For each item above:
1. **Read** the documentation statement
2. **Find** the corresponding code implementation
3. **Compare**: Does code match documentation?
4. **Verify**: Are constants/values identical?
5. **Document**: Add checkbox and date when verified

## High-Priority Verifications

These should be checked first (greatest impact if wrong):
1. Terrarium RGB formula (affects all elevation data)
2. Coordinate system transformation (affects all spatial calculations)
3. Animation frame order (affects timing and correctness)
4. Cache TTL (affects data freshness assumptions)

## Frequency

**Recommended verification schedule**:
- After major refactoring: Re-verify all items
- After dependency updates: Verify animation loop and external API contracts
- Monthly: Spot-check 2-3 critical items
- Before releases: Full verification of all items

## Template for Documentation Update

When a mismatch is found:
```
Found mismatch: [Component/Feature]
- Documentation stated: [incorrect value/behavior]
- Code actually does: [correct value/behavior]
- Files affected: [list of doc files]
- Fix applied: [what was changed]
- Date verified: [YYYY-MM-DD]
```

## Impact
- Ensures readers trust documentation based on accurate information
- Catches bugs where code and documentation diverged
- Provides systematic approach to keeping docs current
- Reduces support burden from incorrect implementation attempts
