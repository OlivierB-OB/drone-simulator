# Issue 005: Fragile Line Number References

## Severity
**MEDIUM** - Documentation stability risk from refactoring

## Summary
Documentation contains hardcoded line number references (e.g., `drone.ts:110-118`, `TerrainTextureFactory.ts:47-48`) that become stale when files are refactored, reorganized, or when code moves between files. This reduces documentation reliability and creates false uncertainty about whether documentation is current.

## Current State

### Known Line Number References
- `doc/animation-loop.md` (line 47): References `drone.ts:110-118`
- `doc/visualization/ground-surface.md`: Multiple specific line numbers
- `doc/data/elevations.md`: References to `ElevationDataTileParser.ts` line numbers

### Problems with Line Numbers
1. **Refactoring breaks references**: Adding/removing lines shifts all subsequent line numbers
2. **No indication of staleness**: Reader can't tell if reference is current or outdated
3. **File reorganization breaks links**: Moving code between files invalidates all references
4. **Maintenance burden**: Every code change must update related documentation

## Root Cause
When documentation was created, specific line numbers were included as a convenience feature to help readers locate code. However, this creates a brittle link between documentation and implementation that requires ongoing maintenance.

## Required Action

### Pattern Change
**Old approach** (fragile):
```
drone.ts:110-118
TerrainTextureFactory.ts:47-48
```

**New approach** (stable):
```
drone.ts: updatePosition() method
TerrainTextureFactory.ts: textureConfig initialization
```

### Implementation Strategy
1. **Convert all line number references** to function/method names or logical code sections
2. **Include file paths** for clarity but not line numbers
3. **Use stable identifiers** like:
   - Function/method names (survive refactoring)
   - Class names with method (e.g., `ElevationDataManager.dispose()`)
   - Configuration object names (e.g., `textureConfig`, `elevationConfig`)
   - Section headings in files (e.g., "Web Mercator Conversion" section)

### Files Requiring Updates
- `doc/animation-loop.md`: Replace line numbers with method names
- `doc/visualization/ground-surface.md`: Audit and stabilize all references
- `doc/data/elevations.md`: Convert specific line references to method/class names
- Check all other files for line number references:
  ```bash
  grep -r ":[0-9]\{2,\}" doc/ | grep -E "\.(ts|tsx|js)"
  ```

### Example Conversions
| Old (Fragile) | New (Stable) |
|---------------|--------------|
| `drone.ts:110-118` | `Drone.ts: applyMove() method` |
| `TerrainTextureFactory.ts:47-48` | `TerrainTextureFactory.ts: textureConfig constant` |
| `ElevationDataTileParser.ts:113` | `ElevationDataTileParser.ts: terrarium RGB formula` |
| `App.tsx:line 42` | `App.tsx: initialization sequence` |

## Verification

After implementation:
1. Search for line number references in documentation:
   ```bash
   grep -r ":[0-9][0-9]" doc/ | grep -v "http" | grep -v ":"
   ```
   Should return minimal matches (only timestamps, coordinates, or other non-code references)

2. Manually verify 3-5 references still make sense after reading the code

3. Ensure all references use function/method/class names instead of line numbers

## Impact
- Documentation remains current through refactoring cycles
- Reduces maintenance burden (no line number updates needed)
- Improves documentation reliability and reader confidence
- Creates a more professional documentation standard
- Aligns with best practices in technical documentation (links to concepts, not line numbers)

## Long-term Benefit
This approach scales better as the codebase grows. New developers can find referenced code by searching for function names (supported by IDEs) rather than manually navigating to line numbers.
