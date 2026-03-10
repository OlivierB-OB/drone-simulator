# Issue 004: Missing ElevationSampler Documentation

## Severity
**MEDIUM** - Critical system component lacks dedicated documentation

## Summary
`ElevationSampler` is referenced across multiple documentation files but there is no dedicated section explaining its behavior, API, algorithm, or integration points. The scattered references make it difficult for developers to understand how elevation data flows from raw tiles to the drone's current elevation value.

## Current State

### References to ElevationSampler
- `doc/visualization/objects.md` (lines 573-590): Some implementation details mentioned
- `doc/visualization/objects.md` (line 573): "ElevationSampler.sampleAt()"
- `doc/visualization/ground-surface.md` (line 314): Brief mention of ElevationSampler
- `doc/data/elevations.md`: Mentions sampling but lacks dedicated section

### What's Missing
- **API documentation**: Method signatures, parameters, return values
- **Algorithm**: Bilinear interpolation explanation and implementation details
- **Precision details**: How sub-meter accuracy is achieved through interpolation
- **Edge cases**: Tile boundary handling, unloaded tile behavior, ocean vs land considerations
- **Performance**: Sampling cost per frame in animation loop
- **Integration**: How ElevationSampler connects to drone position updates and camera height

## Root Cause
ElevationSampler was likely developed later in the project and documentation wasn't created for it. Knowledge exists in objects.md but isn't centralized or complete.

## Required Action

**Create new section** in `doc/data/elevations.md` after "Decoding & Interpretation" section (line ~420)

**Title**: "Elevation Sampling & Interpolation"

**Content structure**:
1. **Overview paragraph**: Purpose and role in the system
2. **API reference**: Method signatures (at least `sampleAt(location: Location): number`)
3. **Bilinear interpolation explanation**:
   - What it is (averaging 4 surrounding tile samples)
   - Why it's used (smooth height variation between tile sample points)
   - How it works (visual diagram or pseudocode)
4. **Precision details**:
   - Sub-meter accuracy through blue channel interpolation
   - Comparison to raw tile data precision
5. **Edge cases**:
   - Behavior at tile boundaries (seamless interpolation)
   - Unloaded tile handling (fallback strategy)
   - Land vs water distinction (if relevant)
6. **Performance characteristics**:
   - O(1) lookup cost per sample
   - Integration point in animation loop
   - No network I/O (uses cached tile data)
7. **Code reference**: Link to implementation file with method names (not line numbers)

**Link from other sections**:
- Update `doc/visualization/objects.md` (lines 573-590) to reference new section
- Update `doc/visualization/ground-surface.md` (line 314) to reference new section

## Example Structure
```markdown
## Elevation Sampling & Interpolation

The elevation data system goes beyond serving raw tile data. When the drone
needs to know its current elevation at an arbitrary location (not aligned
to tile sample points), the system uses **bilinear interpolation** to compute
smooth height values.

### API Reference

```typescript
class ElevationSampler {
  sampleAt(location: Location): number
}
```

### Algorithm: Bilinear Interpolation

[Explanation with diagram or pseudocode]

### Precision & Accuracy

[Discussion of sub-meter accuracy]

### Edge Cases & Special Handling

[Boundary handling, fallbacks]

### Performance Integration

[O(1) cost, animation loop integration]
```

## Verification

After implementation:
1. No broken references from objects.md or ground-surface.md
2. New section is self-contained and comprehensible to new developers
3. API, algorithm, and integration are all explained
4. Cross-references are bidirectional (elevation sampling references back to ElevationSampler docs)

## Impact
- Centralizes knowledge about elevation sampling in one authoritative location
- Reduces information scatter across multiple files
- Helps new developers understand the complete elevation data flow
- Provides API reference for ElevationSampler usage
- Documents critical interpolation algorithm
