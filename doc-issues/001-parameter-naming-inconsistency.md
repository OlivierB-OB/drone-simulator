# Issue 001: Parameter Naming Inconsistency

## Severity
**HIGH** - Creates confusion for developers implementing or maintaining tile ring functionality

## Summary
Ring configuration parameters are documented with inconsistent names across the codebase documentation. Some files reference `ringRadius` while others reference `tileRing`.

## Current State

### Files with `ringRadius`
- `doc/tile-ring-system.md` (lines 160-183): Uses `ringRadius` in code examples
- `doc/data/elevations.md` (line 56): Uses `ringRadius`
- `doc/data/contextual.md` (line 72): Uses `ringRadius`
- `doc/visualization/ground-surface.md` (line 265): References `elevationConfig.ringRadius`

### Files with `tileRing`
- `CLAUDE.md` (architecture section): Lists `tileRing: 2`

## Root Cause
Likely result of code refactoring where parameter names changed but documentation wasn't fully updated, or different components use different naming conventions.

## Required Action
1. **Verify source of truth** in `src/config.ts` to identify the actual parameter name(s)
2. **Check usage patterns** in:
   - ElevationDataManager
   - ContextDataManager
   - TerrainObjectManager
3. **Update all documentation** to use consistent naming across:
   - CLAUDE.md
   - doc/tile-ring-system.md
   - doc/data/elevations.md
   - doc/data/contextual.md
   - doc/visualization/ground-surface.md

## Verification
After fix, grep all doc files for both terms and verify only one naming convention appears:
```bash
grep -r "ringRadius\|tileRing" doc/ CLAUDE.md
```

## Impact
- Prevents developer confusion when implementing tile ring features
- Ensures configuration examples are correct and copy-paste ready
- Maintains single source of truth principle
