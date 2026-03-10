# Issue 002: Tile Size Estimate Conflicts

## Severity
**HIGH** - Confusing inconsistency in a fundamental spatial metric used throughout documentation

## Summary
Tile size at zoom level 15 is documented with three different values (1.22 km, 2 km, and 2.1 km) across different files with no clear explanation for the discrepancy.

## Current State

| File | Location | Value | Context |
|------|----------|-------|---------|
| `doc/tile-ring-system.md` | line 238 | ~1.22 km | Exact value |
| `doc/data/elevations.md` | line 238 | ~1.22 km | Exact value with note |
| `doc/data/elevations.md` | line 241 | ~2 km | Labeled as "rounded estimate" |
| `doc/data/contextual.md` | line 84 | ~1.22 km × ~1.22 km | Exact; notes rounded to ~2 km |
| `doc/data/contextual.md` | line 464 | ~2.1 km × ~2.1 km | No explanation |
| `doc/visualization/ground-surface.md` | line 248 | ~2 km | Informal rounded value |

## Root Cause
- **1.22 km**: Mathematically correct (40075 km / 2^15 = 1.22 km)
- **~2 km**: Informal rounded approximation for documentation/discussion
- **~2.1 km**: Likely typo or outdated calculation error

## Required Action
1. **Establish single source of truth**: Use exact value (1.22 km) as primary reference
2. **Create consistent pattern**:
   - Always state exact value first: "~1.22 km"
   - Only use "rounded to ~2 km" when informal approximation is helpful
   - Never use "2.1 km" — verify if this is typo and remove
3. **Update files**:
   - `doc/data/contextual.md` line 464: Replace "2.1 km × 2.1 km" with "1.22 km × 1.22 km"
   - `doc/data/contextual.md` line 84: Clarify rounding with reference to elevations.md clarification
   - `doc/visualization/ground-surface.md` line 248: Update to "~1.22 km (rounded to ~2 km for informal discussion)"

## Formula Reference
```
Tile size (km) = 40075 km / 2^zoom_level

At zoom 15: 40075 / 32768 ≈ 1.22 km per tile
At zoom 15: Latitude varies; typical ~1.64 km at equator
```

## Verification
After fix, all files should consistently reference 1.22 km as exact value:
```bash
grep -r "km" doc/ | grep -i tile
```

Expected pattern: "1.22 km" or "~1.22 km" as primary value; "~2 km" only with clear label as approximation.

## Impact
- Ensures readers have accurate spatial reference for tile-based caching system
- Clarifies that "~2 km" is informal rounded estimate, not actual value
- Prevents confusion when implementing or debugging tile-based algorithms
- Aligns documentation with actual Web Mercator projection mathematics
