# Mansard Roof — Implementation Plan

## 1. Shape Description

A mansard roof (named after François Mansart, 17th-century French architect) has **four sides, each with two distinct slopes**: a steep lower section and a nearly flat (or very gently sloped) upper section. The boundary where the steep slope transitions to the shallow slope is called the **break line**. Above the break line sits a platform — often flat or nearly so — giving the roof a characteristic truncated appearance.

This shape is the defining feature of Haussmann-era Parisian buildings and is extremely common in French urban architecture. It is essentially the four-sided analog of a gambrel roof: gambrel applies the double-slope logic to two sides (like gabled); mansard applies it to all four sides (like hipped).

```
    ___________
   /           \   ← shallow upper slope (nearly flat)
  /             \
 /_______________\  ← break line at breakHeight
|                 |
|   steep lower   |  ← steep lower slope
|                 |
|_________________|  ← base at Y=0
```

Key visual parameters:

- **`breakHeight`** — the Y elevation at which the steep section meets the shallow section. Typically `roofHeight * 0.6` (the steep lower section is 60% of total roof height).
- **`breakInset`** — how far the break-line ring is inset from the outer footprint. Controls the steepness of the lower slope. Typically `halfWidth * 0.4`.
- **`topInset`** — additional inset from the break ring to the flat top platform. Controls the shallowness of the upper slope. Typically `halfWidth * 0.15`.

The top platform is flat (all four top corners at `Y = roofHeight`).

**OSM/Overture tags:** `roof:shape=mansard`, `roof:height`, `roof:levels`

---

## 2. Current State

Not implemented. The key `'mansard'` is absent from `RoofGeometryFactory`'s strategies map. No `MansardRoofStrategy.ts` file exists in `src/features/building/roofStrategies/`.

The shape is referenced elsewhere in the codebase (presumably in `PITCHED_SHAPES` or equivalent tag-mapping sets) but will silently return `null` from `RoofGeometryFactory.create()` until the strategy is registered.

---

## 3. Algorithm

### Conceptual relationship to existing strategies

| Strategy    | Sides | Slopes per side |
|-------------|-------|-----------------|
| Hipped      | 4     | 1               |
| Pyramidal   | 4     | 1 (meets at point)|
| **Mansard** | **4** | **2**           |
| Gabled      | 2     | 1 (+ 2 vertical gable ends) |

Mansard extends hipped by splitting each of the four slope panels horizontally at `breakHeight`, introducing a second ring of vertices at the break line.

### Vertex levels

Three horizontal rings of OBB corners are computed, one per height level:

```
Level 0 — base    (Y = 0)          : C0, C1, C2, C3  (full OBB extents)
Level 1 — break   (Y = breakH)     : B0, B1, B2, B3  (OBB inset by breakInset)
Level 2 — top     (Y = roofHeight) : T0, T1, T2, T3  (OBB further inset by topInset)
```

Corner labeling follows the same convention as all other OBB-based strategies (matching `getOBBCorners` output):

```
C0: +along +across   C1: +along -across
C3: -along +across   C2: -along -across
```

That is, going around the OBB: C0 → C1 → C2 → C3 traces a loop (the exact spatial order depends on `ridgeAngle`, but the index labels are fixed).

### OBB shrinking for break and top rings

```
// Base OBB (full extents)
obb0 = computeOBB(outerRing)
corners0 = getOBBCorners(obb0, ridgeAngle)   → [C0, C1, C2, C3]

// Break OBB (inset breakInset on all sides)
obb1 = {
  center:     obb0.center,
  halfLength: obb0.halfLength - breakInset,
  halfWidth:  obb0.halfWidth  - breakInset,
  angle:      obb0.angle
}
corners1 = getOBBCorners(obb1, ridgeAngle)   → [B0, B1, B2, B3]

// Top OBB (inset breakInset + topInset on all sides)
obb2 = {
  center:     obb0.center,
  halfLength: obb0.halfLength - breakInset - topInset,
  halfWidth:  obb0.halfWidth  - breakInset - topInset,
  angle:      obb0.angle
}
corners2 = getOBBCorners(obb2, ridgeAngle)   → [T0, T1, T2, T3]
```

`getOBBCorners` is called with the same `ridgeAngle` at all three levels, so corners are spatially aligned (each Bn is directly above the inset position of Cn, and each Tn is above Bn).

### Face layout

The geometry has **9 faces** total: 4 lower quad faces + 4 upper quad faces + 1 top quad face. Each quad is split into 2 triangles.

**Total triangles: 9 quads × 2 = 18 triangles = 54 index values.**

The geometry uses `setIndex()` with 12 unique vertices (C0–C3 at Y=0, B0–B3 at Y=breakH, T0–T3 at Y=roofHeight).

#### Vertex array (12 vertices, positions only)

```
index  label  coords
  0    C0     [C0.x,  0,      C0.z]
  1    C1     [C1.x,  0,      C1.z]
  2    C2     [C2.x,  0,      C2.z]
  3    C3     [C3.x,  0,      C3.z]
  4    B0     [B0.x,  breakH, B0.z]
  5    B1     [B1.x,  breakH, B1.z]
  6    B2     [B2.x,  breakH, B2.z]
  7    B3     [B3.x,  breakH, B3.z]
  8    T0     [T0.x,  h,      T0.z]
  9    T1     [T1.x,  h,      T1.z]
 10    T2     [T2.x,  h,      T2.z]
 11    T3     [T3.x,  h,      T3.z]
```

#### Lower steep faces (base → break)

Each face connects one edge of the base ring to the corresponding edge of the break ring. Outward-facing winding (CCW when viewed from outside):

```
Face name        Quad vertices      Triangle indices
+across lower    C0, C3, B3, B0    [0,3,7,  0,7,4]
-across lower    C2, C1, B1, B2    [2,1,5,  2,5,6]
+along lower     C1, C0, B0, B1    [1,0,4,  1,4,5]
-along lower     C3, C2, B2, B3    [3,2,6,  3,6,7]
```

#### Upper shallow faces (break → top)

```
Face name        Quad vertices      Triangle indices
+across upper    B0, B3, T3, T0    [4,7,11,  4,11,8]
-across upper    B2, B1, T1, T2    [6,5,9,   6,9,10]
+along upper     B1, B0, T0, T1    [5,4,8,   5,8,9]
-along upper     B3, B2, T2, T3    [7,6,10,  7,10,11]
```

#### Top flat face

The top is a quad T0–T1–T2–T3 facing upward (+Y normal). Split into two triangles with CCW winding when viewed from above:

```
Triangle 1: T0, T3, T2   → [8,11,10]
Triangle 2: T0, T2, T1   → [8,10,9]
```

#### Complete index array (54 values)

```typescript
const indices = [
  // Lower steep faces (4 quads × 2 triangles)
  0,3,7,  0,7,4,   // +across lower
  2,1,5,  2,5,6,   // -across lower
  1,0,4,  1,4,5,   // +along lower
  3,2,6,  3,6,7,   // -along lower
  // Upper shallow faces (4 quads × 2 triangles)
  4,7,11, 4,11,8,  // +across upper
  6,5,9,  6,9,10,  // -across upper
  5,4,8,  5,8,9,   // +along upper
  7,6,10, 7,10,11, // -along upper
  // Top face (1 quad × 2 triangles)
  8,11,10, 8,10,9,
];
```

`geom.computeVertexNormals()` is called after setting position and index — this produces smooth normals, which is fine since each ring of vertices is shared by two adjacent slope panels (matching the behaviour of `HippedRoofStrategy`).

---

## 4. TypeScript Sketch

```typescript
// src/features/building/roofStrategies/MansardRoofStrategy.ts

import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, OBB, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';

export class MansardRoofStrategy implements IRoofGeometryStrategy {
  private readonly BREAK_HEIGHT_FRACTION = 0.6;  // steep section = 60% of total height
  private readonly BREAK_INSET_FRACTION = 0.4;   // break ring inset = 40% of halfWidth
  private readonly TOP_INSET_FRACTION = 0.15;    // top ring additional inset = 15% of halfWidth

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const breakH = h * this.BREAK_HEIGHT_FRACTION;
    const breakInset = obb.halfWidth * this.BREAK_INSET_FRACTION;
    const topInset = obb.halfWidth * this.TOP_INSET_FRACTION;

    // Guard: if break inset collapses the OBB, fall back to pyramidal
    const minDimension = Math.min(obb.halfLength, obb.halfWidth);
    if (breakInset >= minDimension) {
      return new PyramidalRoofStrategy().create(params);
    }

    // Level 0: base ring at Y=0
    const corners0 = getOBBCorners(obb, params.ridgeAngle);

    // Level 1: break ring at Y=breakH
    const obb1: OBB = {
      center: obb.center,
      halfLength: obb.halfLength - breakInset,
      halfWidth: obb.halfWidth - breakInset,
      angle: obb.angle,
    };
    const corners1 = getOBBCorners(obb1, params.ridgeAngle);

    // Level 2: top ring at Y=h
    const obb2: OBB = {
      center: obb.center,
      halfLength: obb.halfLength - breakInset - topInset,
      halfWidth: obb.halfWidth - breakInset - topInset,
      angle: obb.angle,
    };
    // Guard: if top inset also collapses, clamp to a point (degenerate top)
    if (obb2.halfLength <= 0 || obb2.halfWidth <= 0) {
      obb2.halfLength = Math.max(obb2.halfLength, 0.01);
      obb2.halfWidth = Math.max(obb2.halfWidth, 0.01);
    }
    const corners2 = getOBBCorners(obb2, params.ridgeAngle);

    // 12 vertices: 4 base + 4 break + 4 top
    // Three.js space: X = mercX, Y = height, Z = -mercY
    // getOBBCorners returns [x, 0, z] — we override Y for each level
    const positions = new Float32Array([
      // Level 0: C0,C1,C2,C3 at Y=0
      corners0[0]![0], 0,      corners0[0]![2], // 0: C0
      corners0[1]![0], 0,      corners0[1]![2], // 1: C1
      corners0[2]![0], 0,      corners0[2]![2], // 2: C2
      corners0[3]![0], 0,      corners0[3]![2], // 3: C3
      // Level 1: B0,B1,B2,B3 at Y=breakH
      corners1[0]![0], breakH, corners1[0]![2], // 4: B0
      corners1[1]![0], breakH, corners1[1]![2], // 5: B1
      corners1[2]![0], breakH, corners1[2]![2], // 6: B2
      corners1[3]![0], breakH, corners1[3]![2], // 7: B3
      // Level 2: T0,T1,T2,T3 at Y=h
      corners2[0]![0], h,      corners2[0]![2], // 8:  T0
      corners2[1]![0], h,      corners2[1]![2], // 9:  T1
      corners2[2]![0], h,      corners2[2]![2], // 10: T2
      corners2[3]![0], h,      corners2[3]![2], // 11: T3
    ]);

    const indices = [
      // Lower steep faces (4 quads × 2 triangles = 8 triangles)
      0,3,7,  0,7,4,   // +across lower: C0-C3-B3-B0
      2,1,5,  2,5,6,   // -across lower: C2-C1-B1-B2
      1,0,4,  1,4,5,   // +along lower:  C1-C0-B0-B1
      3,2,6,  3,6,7,   // -along lower:  C3-C2-B2-B3
      // Upper shallow faces (4 quads × 2 triangles = 8 triangles)
      4,7,11, 4,11,8,  // +across upper: B0-B3-T3-T0
      6,5,9,  6,9,10,  // -across upper: B2-B1-T1-T2
      5,4,8,  5,8,9,   // +along upper:  B1-B0-T0-T1
      7,6,10, 7,10,11, // -along upper:  B3-B2-T2-T3
      // Top face (1 quad × 2 triangles = 2 triangles)
      8,11,10, 8,10,9, // T0-T3-T2, T0-T2-T1
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Utilities to Reuse

| Utility | Source | Usage |
|---------|--------|-------|
| `computeOBB(ring)` | `roofGeometryUtils.ts` | Derive center, halfLength, halfWidth, angle from footprint |
| `getOBBCorners(obb, ridgeAngle)` | `roofGeometryUtils.ts` | Called 3 times — once per height level, with progressively smaller OBBs |
| `PyramidalRoofStrategy` | `PyramidalRoofStrategy.ts` | Fallback when break inset collapses the ring |
| `Float32BufferAttribute`, `BufferGeometry` | Three.js | Standard geometry assembly |

`ShapeUtils.triangulateShape` is **not needed** here because the top face is always a convex quad (four OBB corners), which trivially splits into two triangles. If a true footprint-polygon top were used instead of the OBB approximation, `ShapeUtils.triangulateShape` would be required.

---

## 6. Note on Footprint Accuracy

The current algorithm uses OBB corners for all three rings. This means:

- The base ring (Level 0) is the OBB of the actual footprint, not the footprint itself. Buildings with L-shapes, T-shapes, or irregular polygons will have their base approximated as a rectangle.
- The break and top rings are simply scaled-down rectangles. They are spatially correct relative to the OBB, but may not respect the actual wall geometry.

This is consistent with how `HippedRoofStrategy` and `GabledRoofStrategy` work — they also use OBB-based geometry. The visual result is acceptable for most real-world buildings (which are close to rectangular), and the OBB approach keeps the implementation simple and fast.

**Future improvement path — true polygon inset:**

For full footprint accuracy, each edge of `outerRing` would be offset inward by `breakInset` meters (translate the edge along its inward normal), then the inset edges would be intersected pairwise to produce the break-ring polygon. This is the Minkowski difference / straight-skeleton approach. The resulting polygon would then be used at Level 1, and inset again for Level 2. The faces would be built by connecting matching edges of successive rings rather than OBB corners.

This is more complex to implement correctly (handling convex corners, concave corners, edge collapse), but would produce accurate geometry for non-rectangular buildings.

---

## 7. Edge Cases

### `breakInset >= halfWidth` (or `>= halfLength`)

The break ring collapses to a line or a point — the building is too narrow for the chosen inset fractions.

**Handling:** Compare `breakInset` against `Math.min(obb.halfLength, obb.halfWidth)` before constructing `obb1`. If it would collapse, fall back to `PyramidalRoofStrategy`. This is the same pattern used in `HippedRoofStrategy` for the square-building degeneracy case.

```typescript
if (breakInset >= minDimension) {
  return new PyramidalRoofStrategy().create(params);
}
```

### `topInset` pushes the top ring negative

If `obb.halfWidth - breakInset - topInset <= 0`, the top platform becomes a point/line. Two options:

1. Clamp the top OBB half-extents to a small positive value (`0.01 m`) — preserves the quad-based geometry at near-zero size.
2. Treat it as a hipped-style top (two ridge points instead of four) — more complex, not worth the effort at this stage.

The sketch above uses option 1 (clamp to `0.01`). The resulting top face will be nearly invisible but the geometry remains valid.

### Very small buildings

For buildings where `halfWidth < 2 m` or `halfLength < 2 m`, the default fractions may produce too-aggressive insets. The fractions (`BREAK_INSET_FRACTION`, `TOP_INSET_FRACTION`) are applied relative to `halfWidth`, so they scale naturally. No special handling is needed beyond the collapse guard above.

### Non-rectangular footprint

The OBB approximates any polygon as a rectangle. An L-shaped building will have a mansard roof that extends slightly outside the actual walls on the inner corners of the L. This is the known limitation described in Section 6. No code-level mitigation is planned for the initial implementation.

### Zero `roofHeight`

Results in all three rings collapsed to Y=0. The geometry is technically valid (degenerate flat surface) but meaningless. The caller (`RoofGeometryFactory`) is expected to have filtered flat roofs before calling `create()`. No special guard needed.

---

## 8. OSM/Overture Tags

| Tag | Meaning | Usage |
|-----|---------|-------|
| `roof:shape=mansard` | Identifies this shape | Strategy dispatch key |
| `roof:height` | Height of the roof section in metres | Maps to `roofHeight` in `RoofParams` |
| `roof:levels` | Number of storeys within the roof (informational) | Not used in geometry; affects wall height calculation upstream |
| `building:levels` | Total building levels | Used by upstream building parser, not the strategy |

The dispatch key in `RoofGeometryFactory` must be the string `'mansard'` (lowercase), matching the raw tag value from OSM/Overture.

---

## 9. Registration

Two edits required:

### 9a. `RoofGeometryFactory.ts`

Add the import and register the strategy in the `strategies` map:

```typescript
// Add import alongside the other strategy imports:
import { MansardRoofStrategy } from './roofStrategies/MansardRoofStrategy';

// Add entry in the Map constructor:
['mansard', new MansardRoofStrategy()],
```

Full updated map:

```typescript
private readonly strategies = new Map<string, IRoofGeometryStrategy>([
  ['pyramidal', new PyramidalRoofStrategy()],
  ['cone',      new ConeRoofStrategy()],
  ['gabled',    new GabledRoofStrategy()],
  ['hipped',    new HippedRoofStrategy()],
  ['skillion',  new SkillionRoofStrategy()],
  ['dome',      new DomeRoofStrategy()],
  ['onion',     new OnionRoofStrategy()],
  ['mansard',   new MansardRoofStrategy()],  // ← add this
]);
```

### 9b. Test coverage

Add a `describe('mansard', ...)` block to `RoofGeometryFactory.test.ts` following the same pattern as `hipped`:

```typescript
describe('mansard', () => {
  it('creates geometry for elongated rectangle', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    expect(geom).not.toBeNull();
    // 12 vertices: 4 base + 4 break + 4 top (indexed geometry)
    expect(geom!.attributes.position!.count).toBe(12);
  });

  it('has base at Y=0', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    const pos = geom!.attributes.position!;
    let minY = Infinity;
    for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(0, 5);
  });

  it('has top at Y=roofHeight', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    const pos = geom!.attributes.position!;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
    expect(maxY).toBeCloseTo(5, 1);
  });

  it('has break ring at intermediate Y (between 0 and roofHeight)', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    const pos = geom!.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) ys.add(Math.round(pos.getY(i) * 100));
    // Expect 3 distinct Y levels
    expect(ys.size).toBe(3);
  });

  it('is indexed geometry', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    expect(geom!.index).not.toBeNull();
    // 18 quads as triangles = 54 index values
    expect(geom!.index!.count).toBe(54);
  });

  it('all slope normals have positive Y component', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
    geom!.computeVertexNormals();
    const normals = geom!.attributes.normal!;
    // Every vertex on slope faces should have Y > 0
    for (let i = 0; i < normals.count; i++) {
      expect(normals.getY(i)).toBeGreaterThanOrEqual(0);
    }
  });

  it('falls back to pyramidal for very narrow building', () => {
    const thinBuilding: [number, number][] = [
      [0.5, 5], [-0.5, 5], [-0.5, -5], [0.5, -5], [0.5, 5],
    ];
    const geom = factory.create({
      ...baseParams,
      outerRing: thinBuilding,
      roofShape: 'mansard',
    });
    // Pyramidal is non-indexed
    expect(geom!.index).toBeNull();
  });
});
```

---

## Summary

| Property | Value |
|----------|-------|
| File to create | `src/features/building/roofStrategies/MansardRoofStrategy.ts` |
| Strategy key | `'mansard'` |
| Vertex count | 12 (4 base + 4 break + 4 top) |
| Triangle count | 18 (8 lower + 8 upper + 2 top) |
| Index count | 54 |
| Geometry type | Indexed (`setIndex`) with `computeVertexNormals` |
| Utilities used | `computeOBB`, `getOBBCorners`, `PyramidalRoofStrategy` (fallback) |
| Fallback condition | `breakInset >= Math.min(halfLength, halfWidth)` |
| Known limitation | OBB approximation — non-rectangular footprints not handled accurately |
