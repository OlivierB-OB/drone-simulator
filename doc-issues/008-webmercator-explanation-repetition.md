# Issue 008: Web Mercator Explanation Repetition (Low Priority)

## Severity
**LOW** - Acceptable duplication due to self-contained documentation style

## Summary
Web Mercator projection basics are explained in multiple documentation files. While this repetition is somewhat justified (each doc should be somewhat self-contained), it could be optimized to reduce verbosity.

## Current State

### Files with Mercator Explanations
- `doc/coordinate-system.md` (lines 13-27): Comprehensive explanation
- `doc/tile-ring-system.md` (lines 411-427): Medium-length explanation
- `doc/data/elevations.md` (lines 166-175): Shorter explanation
- `doc/data/contextual.md` (lines 501-515): Medium-length explanation
- `doc/visualization/ground-surface.md` (line 254): Brief mention

### Duplicate Content
All provide the same core information:
- X increases eastward
- Y increases northward (standard Web Mercator, not inverted)
- Tiles are indexed as z/x/y
- Projection covers the world with equator as reference

## Assessment

**Why this repetition is acceptable**:
1. **Self-contained docs**: Each file should be understandable without reading all others
2. **Different contexts**: Mercator explanation appears in different contexts:
   - Coordinate system doc: foundational concept
   - Tile system doc: tile indexing rationale
   - Elevation doc: spatial organization of elevation data
   - Contextual doc: spatial organization of features
3. **Different audiences**: Some readers may only read one doc
4. **Conceptual emphasis**: Different docs emphasize different aspects of the projection

## Optimization Opportunity (Optional)

**If verbosity reduction is desired**, pattern:
1. Keep full explanation in `doc/coordinate-system.md` (authoritative reference)
2. In other files, reference and summarize:
   ```markdown
   Web Mercator projection ([see Coordinate System](../coordinate-system.md))
   organizes tiles using z/x/y indexing where X increases eastward and Y
   increases northward.
   ```
3. Include quick-reference table:
   ```markdown
   | Axis | Direction | Notes |
   |------|-----------|-------|
   | X | Eastward (+) | Longitude-based |
   | Y | Northward (+) | Latitude-based (standard, not inverted) |
   | Z | Zoom level | Determines tile grid density |
   ```

## Recommendation

**NO ACTION REQUIRED** for this issue. The repetition is justified and actually helpful for documentation usability.

## Related Documentation

See Issue 002 (tile size estimates) and Issue 001 (parameter naming) for actual inconsistencies that should be fixed.

## Summary Table

| Document | Length | Focus | Can be Shortened? |
|----------|--------|-------|-------------------|
| coordinate-system.md | Full | Foundational | No (authoritative) |
| tile-ring-system.md | Medium | Tile indexing | Maybe - reference base doc |
| elevations.md | Short | Spatial organization | Maybe - reference base doc |
| contextual.md | Medium | Feature organization | Maybe - reference base doc |
| ground-surface.md | Brief | Implicit context | No - minimal mention |

## Status

**CLOSED** - Acceptable duplication; not a defect.
