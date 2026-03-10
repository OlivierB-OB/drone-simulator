# Issue 003: Duplicate Tile Ring Diagram

## Severity
**MEDIUM** - Redundant content that violates DRY principle and creates maintenance burden

## Summary
The tile ring ASCII diagram is documented in two separate locations with nearly identical visuals but different numeric labeling schemes. This creates duplication and potential for divergent updates.

## Current State

### Primary Diagram
**Location**: `doc/tile-ring-system.md` (lines 86-92)
```
    (tx-1,ty-1) (tx,ty-1) (tx+1,ty-1)
        ┌─────────┬─────────┬─────────┐
    (tx-1,ty)   [DRONE]            (tx+1,ty)
        ├─────────┼─────────┼─────────┤
```

### Duplicate Diagram
**Location**: `doc/visualization/objects.md` (lines 542-550)
```
    [8] [9] [10]
    [5] [D] [6]     D = drone position
    [2] [3] [4]
```

## Root Cause
When documentation was created, the tile ring concept was independently explained in the objects.md file without referencing the dedicated tile-ring-system.md file.

## Issues with Current Duplication

1. **Maintenance burden**: Changes to the conceptual diagram in tile-ring-system.md won't automatically propagate to objects.md
2. **Inconsistent numbering**: Different labeling schemes (coordinate tuples vs fetch order numbers) may confuse readers
3. **Violates DRY principle**: Same spatial concept documented twice
4. **No clear delineation**: Readers may not understand why there are two different diagrams

## Required Action

**Delete** the tile ring diagram from `doc/visualization/objects.md` (lines 542-550)

**Replace with** concise reference:
```markdown
See [Tile Ring System](../tile-ring-system.md) for details on how tiles
are organized in a ring pattern around the drone. The tiles in that diagram
are numbered [2-10] showing the order in which they are fetched and loaded
into the mesh system.
```

**Keep unique content** in objects.md:
- Explanation specific to object rendering (why tiles matter for building/POI loading)
- How tile loading integrates with the mesh factory pipeline
- Fetch order optimization

## Verification

After fix:
1. Search for ASCII tile ring diagrams in doc/:
   ```bash
   grep -r "┌─────────┬─────────" doc/
   ```
   Should only appear in `doc/tile-ring-system.md`

2. Verify objects.md still references tile-ring-system.md:
   ```bash
   grep "tile-ring-system" doc/visualization/objects.md
   ```

## Impact
- Eliminates maintenance burden of keeping two diagrams in sync
- Reduces cognitive load on documentation by centralizing spatial concepts
- Preserves all unique contextual information in objects.md while delegating diagram to single source
- Demonstrates documentation best practices (DRY principle)
