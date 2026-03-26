# Crosspitched Roof Strategy — Implementation Plan

## 1. Shape Description

A crosspitched roof consists of **two gabled roof sections intersecting at roughly right angles**. Each wing of the building carries its own ridge line, and the two ridges meet or cross — producing a **valley** (internal concave crease) or, at the junction, a **hip geometry** depending on the exact footprint shape.

Typical contexts:
- **Cruciform (cross-shaped) churches and manor houses** — both ridges run the full length of their respective wings, crossing at the centre.
- **T-shaped residential buildings** — the main ridge and the wing ridge meet, creating a valley on one side.
- **L-shaped annexes** — one full gabled ridge, one shorter perpendicular ridge butting into the slope of the first.

The defining visual feature is the **valley line**: the inclined trough where two sloping roof planes meet. In a symmetric cross plan the valley lines radiate from the intersection point to each internal corner of the cruciform footprint.

OSM key: `roof:shape=crosspitched`.

---

## 2. Current State

**Not implemented.** The key `'crosspitched'` is absent from `RoofGeometryFactory.ts`'s strategy map. Calling `factory.create({ roofShape: 'crosspitched', ... })` currently returns `null` and the building receives no roof geometry.

---

## 3. Algorithm

### 3.1 Coordinate conventions

Consistent with all other strategies:
- **Input**: `outerRing` — local Mercator XY coordinates in metres, centroid-relative.
- **Output**: Three.js buffer, where `X = mercX`, `Y = height`, `Z = -mercY`.
- **Base plane**: `Y = 0`. Apex height: `Y = roofHeight`.

### 3.2 Core insight: the max() formula

A gabled roof assigns height to each footprint point based on its perpendicular distance from the ridge line. Denote the across-ridge projection of a point `p` as `acrossProj(p)` and the across-ridge half-width (eave-to-centre distance) as `halfWidth`. The gabled height function is:

```
h_gabled(p) = roofHeight * max(0, 1 - |acrossProj(p)| / halfWidth)
```

This is a **tent function**: it peaks at `roofHeight` on the ridge centre-line and falls linearly to zero at the eaves.

A crosspitched roof is geometrically the **upper envelope** of two such tent functions with perpendicular ridge axes:

```
h(p) = max(h_ridge1(p), h_ridge2(p))
```

**Why this is correct**: at any footprint point, the actual roof surface is whichever of the two gabled planes is higher. Where they are equal, that locus is the **valley line** — the implicit intersection of the two planes. The `max()` formula generates this intersection automatically, with no explicit valley computation required.

Geometrically, where `h1(p) > h2(p)` the point lies on the surface of ridge-1's gabled plane; where `h2(p) > h1(p)` it lies on ridge-2's plane; and where they are equal it lies on the valley. The transition between the two regions traces a straight line (in 2D plan view), which is exactly the valley line projected vertically.

### 3.3 Step-by-step algorithm

#### Step 0 — Closed ring and winding detection

```
isClosedRing = (ring[0] == ring[ring.length-1])
count = isClosedRing ? ring.length - 1 : ring.length

// Shoelace signed area
signedArea = sum over i of (ring[i][0]*ring[j][1] - ring[j][0]*ring[i][1])  where j=(i+1)%count
isCCW = signedArea > 0
```

#### Step 1 — OBB and ridge angles

```
obb = computeOBB(ring)
// ridgeAngle is already resolved by the caller via resolveRidgeAngle(obb.angle, roofDirection, roofOrientation)
angle1 = params.ridgeAngle           // primary ridge, radians, CCW from +X (east)
angle2 = params.ridgeAngle + PI/2    // secondary ridge, perpendicular
```

The OBB primary axis aligns with `angle1` by construction (when `resolveRidgeAngle` is used without override). The secondary ridge is perpendicular.

#### Step 2 — Across-ridge unit vectors (in Mercator XY)

For a ridge running in direction `(cos(a), sin(a))`, the across-ridge direction is `(-sin(a), cos(a))`:

```
across1X = -sin(angle1),  across1Y = cos(angle1)
across2X = -sin(angle2),  across2Y = cos(angle2)
```

Note: `across2 = (-sin(angle1 + PI/2), cos(angle1 + PI/2)) = (-cos(angle1), -sin(angle1))`, which is exactly the negated OBB primary axis — confirming the perpendicularity.

#### Step 3 — Half-widths

For ridge 1, its across direction is the OBB's short axis, so its eave-to-ridge half-width is `obb.halfWidth`.
For ridge 2, its across direction is the OBB's long axis, so its eave-to-ridge half-width is `obb.halfLength`.

However, if both ridge half-widths are used as-is, the two gabled profiles reach `roofHeight` at different distances from the centre — which is geometrically valid but produces unequal pitch angles on the two wings. For a symmetric crosspitched roof (same pitch on all wings), use:

```
hW1 = Math.min(obb.halfLength, obb.halfWidth)
hW2 = hW1
```

This ensures both gabled profiles have the same pitch angle (same `roofHeight / halfWidth` ratio) regardless of OBB aspect ratio. The ridge of the shorter wing still reaches `roofHeight`; the longer wing's ridge also does, but the eaves of the longer wing are not the full OBB extent — they match the shorter dimension. This is the correct physical behaviour for a symmetric crosspitched roof.

If asymmetric pitches are desired (matching the actual footprint width of each wing), use `hW1 = obb.halfWidth` and `hW2 = obb.halfLength`. This can be exposed as a strategy variant if needed, but default should be symmetric (equal pitch).

#### Step 4 — Per-vertex height

```
for i in 0..count-1:
    p1 = ring[i][0] * across1X + ring[i][1] * across1Y   // projection onto across-ridge-1
    p2 = ring[i][0] * across2X + ring[i][1] * across2Y   // projection onto across-ridge-2
    h1 = roofHeight * max(0, 1 - |p1| / hW1)
    h2 = roofHeight * max(0, 1 - |p2| / hW2)
    heights[i] = max(h1, h2)
```

The `max(0, ...)` clamping ensures that vertices outside the tent range (which would be negative) are assigned zero height. For well-formed footprints this should not occur since the OBB encloses all vertices by construction, but it guards against numerical edge cases.

#### Step 5 — Top face triangulation

Use `ShapeUtils.triangulateShape` with the footprint contour projected onto XY (Mercator), then lift each triangle vertex to its computed height:

```
contour = [Vector2(ring[i][0], ring[i][1]) for i in 0..count-1]
triangles = ShapeUtils.triangulateShape(contour, [])

for each [i0, i1, i2] in triangles:
    emit vertex: (ring[i0][0], heights[i0], -ring[i0][1])
    emit vertex: (ring[i1][0], heights[i1], -ring[i1][1])
    emit vertex: (ring[i2][0], heights[i2], -ring[i2][1])
```

`ShapeUtils.triangulateShape` expects CCW winding in its 2D input and produces CCW output triangles. After the `Z = -mercY` mapping, CCW Mercator triangles produce upward (`+Y`) normals in Three.js — correct for a roof top face. No winding adjustment is needed for the top face.

#### Step 6 — Side walls

The side walls fill the gap between the flat building wall top (`Y = 0`) and the sloped roof base. Since adjacent roof vertices can have different heights (unlike a flat eave), each wall edge is a general quad.

For each edge `(i, j)` where `j = (i+1) % count`:

The outward normal direction depends on polygon orientation. After the `Z = -mercY` coordinate flip, a CCW Mercator polygon becomes CW in Three.js's XZ plane. Therefore:
- For a **CCW** Mercator polygon: emit vertices in `(i, j)` order to get outward normals.
- For a **CW** Mercator polygon: emit vertices in `(j, i)` order.

Let `a = isCCW ? i : j` and `b = isCCW ? j : i`. The quad for this wall edge decomposes into two triangles:

```
// Triangle 1: bottom-a, bottom-b, top-b
(ring[a][0], 0,          -ring[a][1])
(ring[b][0], 0,          -ring[b][1])
(ring[b][0], heights[b], -ring[b][1])

// Triangle 2: bottom-a, top-b, top-a
(ring[a][0], 0,          -ring[a][1])
(ring[b][0], heights[b], -ring[b][1])
(ring[a][0], heights[a], -ring[a][1])
```

When `heights[a] == heights[b]` (flat eave section) this degenerates to one non-degenerate triangle and one zero-area triangle — harmless; `computeVertexNormals()` handles it. When `heights[a] == heights[b] == 0` (a wall section with no overhang) the two triangles are coplanar and produce a correct vertical quad.

#### Step 7 — Assemble geometry

```
topTriCount  = triangles.length
sideTriCount = count * 2
totalTri     = topTriCount + sideTriCount
positions    = new Float32Array(totalTri * 3 * 3)

// fill positions as above

geom = new BufferGeometry()
geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
geom.computeVertexNormals()
return geom
```

Non-indexed geometry is used (same as `SkillionRoofStrategy`) to allow `computeVertexNormals()` to compute per-face normals for the sloped faces.

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

export class CrosspitchedRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;
    const obb = computeOBB(ring);

    // Closed ring and winding detection
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;

    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // Two perpendicular ridge directions
    const angle1 = params.ridgeAngle;
    const angle2 = params.ridgeAngle + Math.PI / 2;

    // Across-ridge unit vectors in Mercator XY
    const across1X = -Math.sin(angle1);
    const across1Y = Math.cos(angle1);
    const across2X = -Math.sin(angle2);
    const across2Y = Math.cos(angle2);

    // Equal pitch: both ridges use min(halfLength, halfWidth) as their eave half-width
    const hW = Math.min(obb.halfLength, obb.halfWidth);
    const hW1 = hW;
    const hW2 = hW;

    // Per-vertex height: upper envelope of two gabled profiles
    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const p1 = ring[i]![0] * across1X + ring[i]![1] * across1Y;
      const p2 = ring[i]![0] * across2X + ring[i]![1] * across2Y;
      const h1 = h * Math.max(0, 1 - Math.abs(p1) / hW1);
      const h2 = h * Math.max(0, 1 - Math.abs(p2) / hW2);
      heights[i] = Math.max(h1, h2);
    }

    // Top face triangulation via ShapeUtils
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    const topTriCount = triangles.length;
    const sideTriCount = count * 2;
    const positions = new Float32Array((topTriCount + sideTriCount) * 3 * 3);
    let o = 0;

    // Top face
    for (const tri of triangles) {
      const i0 = tri[0]!;
      const i1 = tri[1]!;
      const i2 = tri[2]!;
      positions[o++] = ring[i0]![0]; positions[o++] = heights[i0]!; positions[o++] = -ring[i0]![1];
      positions[o++] = ring[i1]![0]; positions[o++] = heights[i1]!; positions[o++] = -ring[i1]![1];
      positions[o++] = ring[i2]![0]; positions[o++] = heights[i2]!; positions[o++] = -ring[i2]![1];
    }

    // Side walls
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: bottom-a, bottom-b, top-b
      positions[o++] = ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = 0;           positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];

      // Triangle 2: bottom-a, top-b, top-a
      positions[o++] = ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];
      positions[o++] = ring[a]![0]; positions[o++] = heights[a]!; positions[o++] = -ring[a]![1];
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Utilities to Reuse

| Utility | Source | Usage |
|---------|--------|-------|
| `computeOBB(ring)` | `roofGeometryUtils.ts` | Derives `center`, `halfLength`, `halfWidth`, `angle` from `outerRing` |
| `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` | `roofGeometryUtils.ts` | Converts compass degrees or `across` orientation to radians before passing into the strategy; called by the factory, not the strategy itself |
| `ShapeUtils.triangulateShape(contour, holes)` | Three.js | Triangulates the footprint polygon for the top face |
| Closed-ring detection | `SkillionRoofStrategy.ts` | Copy the `isClosedRing` / `count` pattern verbatim |
| Winding detection (shoelace) | `SkillionRoofStrategy.ts` | Copy the `signedArea` / `isCCW` block verbatim |
| Side wall quad emission | `SkillionRoofStrategy.ts` | The two-triangle-per-edge pattern with `a = isCCW ? i : j` is identical |

`getOBBCorners` is **not** used here — the crosspitched strategy works per-vertex on the raw footprint ring, not on OBB corners.

---

## 6. Side Walls — Full Explanation

Unlike a simple gabled or hipped roof where each eave segment is at a uniform height (either all at `Y = 0` or all at the same overhang height), a crosspitched roof's eave height varies per vertex because different vertices fall under different portions of the two intersecting profiles.

For example: a corner vertex at an internal re-entrant of a cruciform footprint may receive a height of several metres (it is deep inside the roof zone, under both ridge profiles), while an outer-corner vertex may be at `Y = 0` (it is at the true eave).

This means every wall edge is potentially a **trapezoid** (two different heights at the two end vertices), not a simple rectangle. The trapezoid must be split into two triangles.

The side wall algorithm:

1. For each consecutive vertex pair `(i, j)` in the footprint:
   - Look up `heights[i]` and `heights[j]` (the per-vertex roof heights from Step 4).
   - Emit a quad from `Y = 0` at both ends up to `Y = heights[i]` and `Y = heights[j]`.

2. The quad's four corners are:
   - `A_bot = (ring[a][0], 0, -ring[a][1])`
   - `B_bot = (ring[b][0], 0, -ring[b][1])`
   - `B_top = (ring[b][0], heights[b], -ring[b][1])`
   - `A_top = (ring[a][0], heights[a], -ring[a][1])`

3. Split into triangles with outward normals:
   - `(A_bot, B_bot, B_top)` — lower triangle
   - `(A_bot, B_top, A_top)` — upper triangle

4. The swap `a = isCCW ? i : j` corrects for the handedness flip introduced by `Z = -mercY`. Without this swap, walls on CCW footprints would have inward-facing normals.

When `heights[i] == heights[j] == 0` the two triangles form a proper vertical rectangular quad. When either height is zero, a right triangle is emitted alongside a degenerate zero-area triangle — `computeVertexNormals()` handles this gracefully.

---

## 7. Edge Cases

| Condition | Behaviour | Notes |
|-----------|-----------|-------|
| **Square footprint** (`halfLength == halfWidth`) | Both ridges have identical profiles; the result is a symmetric X-shaped intersection with four equal valley lines radiating from the centre at 45° to both ridges | Geometrically ideal for this shape |
| **Rectangular footprint** | The ridge along the long axis dominates over most of the footprint; the perpendicular ridge only produces a short raised zone near the centre; the result approximates a gabled roof with two shallow valleys at the gable ends | Visually resembles a hipped gabled roof rather than a true cross |
| **Very elongated footprint** (aspect ratio >> 2) | The shorter half-width `hW = min(halfLength, halfWidth)` means the primary ridge (long axis) reaches `roofHeight` only over a narrow central strip; the `max()` effectively produces the long-axis gabled profile over most of the surface; secondary ridge contribution is minimal | Degenerates toward a single gabled roof |
| **Cruciform (non-convex) footprint** | The `max()` formula correctly handles re-entrant corners; internal corners receive higher `heights` (near the ridge intersection), which is geometrically accurate; `ShapeUtils.triangulateShape` handles non-convex polygons | Main use-case for this shape |
| **`roofHeight = 0`** | All `heights[i] = 0`; geometry degenerates to a flat cap with zero-height side walls | Guard upstream; no special handling needed here |
| **`ridgeAngle` exactly at OBB angle** | Symmetric between the two ridge interpretations; no degenerate case | `resolveRidgeAngle` ensures this is the default |
| **`hW = 0`** (degenerate zero-width OBB) | Division by zero in `1 - |p| / hW` | Guard: `if (hW < 1e-6) return flatFallback()` or let factory return `null` |

---

## 8. OSM / Overture Tags

| Tag | Value | Mapping |
|-----|-------|---------|
| `roof:shape` | `crosspitched` | Strategy key `'crosspitched'` in factory |
| `roof:height` | numeric (metres) | `params.roofHeight` |
| `roof:direction` | compass bearing (degrees) | Converted to `ridgeAngle` by `resolveRidgeAngle` (sets primary ridge direction) |
| `roof:orientation` | `along` / `across` | Passed to `resolveRidgeAngle`; `across` rotates primary ridge 90° |

The secondary ridge is always perpendicular to the primary (`angle1 + PI/2`). There is no OSM tag for the secondary ridge direction — it is always inferred.

---

## 9. Registration

In `src/features/building/RoofGeometryFactory.ts`:

```typescript
import { CrosspitchedRoofStrategy } from './roofStrategies/CrosspitchedRoofStrategy';

// Inside the strategies Map constructor argument:
['crosspitched', new CrosspitchedRoofStrategy()],
```

The full updated map entry list:

```typescript
private readonly strategies = new Map<string, IRoofGeometryStrategy>([
  ['pyramidal',    new PyramidalRoofStrategy()],
  ['cone',         new ConeRoofStrategy()],
  ['gabled',       new GabledRoofStrategy()],
  ['hipped',       new HippedRoofStrategy()],
  ['skillion',     new SkillionRoofStrategy()],
  ['dome',         new DomeRoofStrategy()],
  ['onion',        new OnionRoofStrategy()],
  ['crosspitched', new CrosspitchedRoofStrategy()],  // add this line
]);
```

No changes are needed elsewhere — the factory's `create()` method already dispatches by `params.roofShape` string.

---

## 10. Comparison with Simple Gabled — Why max() is Correct

A **gabled roof** is a single tent function: one ridge axis, one `halfWidth`. Every point on the footprint is assigned the height that places it on the unique sloping plane. The tent function is:

```
h_gabled(p) = roofHeight * max(0, 1 - |acrossProj(p)| / halfWidth)
```

This defines two planes (one per slope side), meeting at the ridge.

A **crosspitched roof** is geometrically the upper boundary of the **union** of two gabled roof volumes. Volume 1 is a wedge-shaped prism along ridge-1; Volume 2 is a wedge-shaped prism along ridge-2. Where these two prisms overlap, whichever surface is higher is the one visible from outside.

At any point `p` on the footprint:
- `h1(p)` is the height of ridge-1's gabled surface above `p`.
- `h2(p)` is the height of ridge-2's gabled surface above `p`.
- The actual roof surface height is `max(h1(p), h2(p))`.

The **valley line** is the set of points where `h1(p) == h2(p)`. This is a pair of linear equations in 2D, so the valley locus is a straight line (in plan view) — exactly what you see on real crosspitched roofs. The `max()` formula generates this transition implicitly: on one side of the valley line `h1 > h2`; on the other `h2 > h1`; at the line they are equal. No explicit intersection computation is needed.

The per-vertex discretisation (computing heights only at polygon vertices, then letting `ShapeUtils.triangulateShape` fill in between) is accurate because the tent functions are **piecewise linear**: they are linear within any triangle of the triangulation. If the triangulation happens to straddle the valley line, the interpolated height will be linear between the two per-vertex values on each side, which is geometrically correct (the valley is where two linear surfaces meet, and linear interpolation between points on those surfaces produces the correct intermediate values).

This makes the `max()` approach not just an approximation but **mathematically exact** for per-vertex height assignment, given that the triangulation respects the linear nature of the underlying surface equations.

The only approximation is that the valley line itself is not explicitly inserted as a triangulation constraint — so if a triangle straddles the valley, the ridge of that triangle (the fold between `h1` and `h2`) will be rendered as a smooth interpolation rather than a sharp crease. For typical building scales and polygon densities this is visually indistinguishable. If a sharp valley crease is required, the valley line would need to be added as a Steiner point into the triangulation — a significant complexity increase that is not warranted for the current use-case.
