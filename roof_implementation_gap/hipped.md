# Hipped Roof — Implementation Plan

## 1. Shape Description

A hipped roof has **four sloping faces**, all rising from the base polygon edges toward a central ridge (or apex). There are no vertical gable ends. Every base edge contributes a sloping face; the ridge is a horizontal line segment connecting the two points where the two long slopes converge, shortened by the hip triangles at each end.

OSM/Overture definition:
- `roof:shape = hipped`
- `roof:height` — vertical rise from eave to ridge (meters)
- `roof:direction` — compass bearing (0–360°) of the ridge axis; takes priority over orientation
- `roof:orientation = along | across` — whether the ridge runs along or across the longest building axis (default: `along`)

For a perfectly square footprint the ridge degenerates to a point and the shape becomes pyramidal.

---

## 2. Current State (Problem)

`HippedRoofStrategy` replaces the actual polygon with the four corners of its oriented bounding box (OBB). The algorithm then builds a 6-vertex mesh (4 base corners + 2 ridge endpoints).

Consequences:
- The actual footprint polygon is **discarded** after OBB computation.
- L-shaped, T-shaped, and any non-rectangular building silhouettes are approximated as rectangles. The resulting roof overhangs or gaps relative to the walls are visually incorrect.
- The approach cannot represent a roof that truly follows an irregular perimeter.

---

## 3. Algorithm

### Core principle — per-vertex height via double projection

The straight skeleton gives every interior point a height proportional to its distance from the nearest base edge. For buildings that are well-approximated by their OBB (which is the overwhelming majority of OSM buildings), an equivalent result can be obtained analytically using two signed projections onto the ridge axes — without implementing a full straight skeleton library.

**Setup**

```
obb       = computeOBB(outerRing)           // halfLength ≥ halfWidth always
ridgeAngle = params.ridgeAngle              // radians, along-ridge direction in Mercator XY

// Unit vectors in Mercator XY space
along  = (cos(ridgeAngle), sin(ridgeAngle))   // ridge axis direction
across = (-sin(ridgeAngle), cos(ridgeAngle))  // perpendicular to ridge

halfLength = obb.halfLength   // half-extent along ridge axis
halfWidth  = obb.halfWidth    // half-extent across ridge axis
```

**Per-vertex height formula**

For each vertex `v = (vx, vy)` in the ring (already centroid-relative):

```
alongProj_i  = (vx - obb.center[0]) * cos(ridgeAngle)
             + (vy - obb.center[1]) * sin(ridgeAngle)

acrossProj_i = (vx - obb.center[0]) * (-sin(ridgeAngle))
             + (vy - obb.center[1]) * cos(ridgeAngle)
```

The height at vertex i is:

```
t_across = 1 - |acrossProj_i| / halfWidth       // slopes from eave to ridge across width
t_along  = (halfLength - |alongProj_i|) / halfWidth  // hip taper at the ends

h_i = roofHeight * clamp(min(t_across, t_along), 0, 1)
```

Explanation of each term:

- `t_across`: drops from 1.0 at the building centreline to 0.0 at either eave. This is the two-slope component present in both gabled and hipped roofs.
- `t_along`: drops from `halfLength/halfWidth` at the centre toward 0 as the vertex approaches either hip end, scaled by `halfWidth` so both terms share the same unit. It equals 1 at a distance `halfWidth` inward from each hip end, which is exactly where the hip triangle meets the ridge.
- `min(t_across, t_along)` is the straight-skeleton approximation: the height is limited by whichever constraint (across-slope or hip taper) is tighter at that point.
- `clamp(..., 0, 1)` prevents negative heights for vertices that protrude beyond the OBB along the ridge axis (can occur for non-convex polygons).

**Why this works**

For a purely rectangular footprint this formula is exact — it reproduces the six-vertex hipped roof. For irregular polygons it is approximate but visually correct: the roof surface still slopes from every eave, the hip taper is preserved at the ends, and no vertex exceeds `roofHeight`. The error is bounded by the deviation of the actual polygon from its OBB, which is small for typical buildings.

**Degenerate check**

Before computing per-vertex heights, check:

```
if (halfWidth <= 0.01) → return PyramidalRoofStrategy (or flat)
if (halfLength <= halfWidth + 0.01) → delegate to PyramidalRoofStrategy
```

The second condition means the ridge would degenerate to a point (the ridge half-length `halfLength - halfWidth ≤ 0`), exactly matching the current fallback logic.

**Geometry construction — two passes**

Pass 1 — **Top face**

Collect the per-vertex heights. Triangulate the top surface using `ShapeUtils.triangulateShape`:

```
contour = ring[0..count-1].map(v => new Vector2(v[0], v[1]))
triangles = ShapeUtils.triangulateShape(contour, [])

// For each triangle [i0, i1, i2]:
//   vertex position: (ring[iN][0], h_iN, -ring[iN][1])   ← Three.js XYZ
```

Pass 2 — **Side walls**

For each base edge `(i → j)` where `j = (i+1) % count`, emit a quad filling the gap between the flat wall top at Y=0 and the sloped roof:

```
// Winding: same as SkillionRoofStrategy — swap a/b when ring is CW
a = isCCW ? i : j
b = isCCW ? j : i

// Triangle 1: bottom-a, bottom-b, top-b
// Triangle 2: bottom-a, top-b,    top-a
```

where "top-x" = `(ring[x][0], h_x, -ring[x][1])` and "bottom-x" = `(ring[x][0], 0, -ring[x][1])`.

This is identical to the side wall pass in `SkillionRoofStrategy` — only the height array differs.

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';

export class HippedRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;

    // --- 1. Ring normalization ---
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;
    if (count < 3) return new BufferGeometry();

    // Winding detection via shoelace (positive = CCW in Mercator XY)
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // --- 2. OBB for ridge geometry ---
    const obb = computeOBB(params.outerRing);
    const halfLength = obb.halfLength;
    const halfWidth = obb.halfWidth;

    // --- 3. Degenerate check: square or near-square → pyramidal ---
    if (halfWidth <= 0.01 || halfLength <= halfWidth + 0.01) {
      return new PyramidalRoofStrategy().create(params);
    }

    // --- 4. Per-vertex height ---
    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const ocx = obb.center[0];
    const ocy = obb.center[1];

    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const dx = ring[i]![0] - ocx;
      const dy = ring[i]![1] - ocy;

      const alongProj  =  dx * cos + dy * sin;
      const acrossProj = -dx * sin + dy * cos;

      const tAcross = 1 - Math.abs(acrossProj) / halfWidth;
      const tAlong  = (halfLength - Math.abs(alongProj)) / halfWidth;
      const t = Math.max(0, Math.min(1, Math.min(tAcross, tAlong)));

      heights[i] = h * t;
    }

    // --- 5. Triangulate top face ---
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    // --- 6. Allocate positions buffer ---
    const topTriCount  = triangles.length;
    const sideTriCount = count * 2;
    const positions = new Float32Array((topTriCount + sideTriCount) * 9);
    let o = 0;

    // --- 7. Top face ---
    for (const tri of triangles) {
      for (const idx of tri) {
        positions[o++] = ring[idx]![0];
        positions[o++] = heights[idx]!;
        positions[o++] = -ring[idx]![1];
      }
    }

    // --- 8. Side walls (quads as two triangles) ---
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: (a,0), (b,0), (b,h_b)
      positions[o++] = ring[a]![0]; positions[o++] = 0;         positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = 0;         positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];

      // Triangle 2: (a,0), (b,h_b), (a,h_a)
      positions[o++] = ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];
      positions[o++] = ring[a]![0]; positions[o++] = heights[a]!; positions[o++] = -ring[a]![1];
    }

    // --- 9. Build BufferGeometry (non-indexed, flat normals) ---
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Utilities to Reuse

| Utility | Role |
|---|---|
| `computeOBB(ring)` | Provides `halfLength`, `halfWidth`, `center`, `angle` — all needed for the projection |
| `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` | Called upstream (in the factory/parser) before `RoofParams` is assembled; `ridgeAngle` arrives already resolved |
| `PyramidalRoofStrategy` | Delegated to when `halfLength ≤ halfWidth + 0.01` |
| `ShapeUtils.triangulateShape` | Triangulates the actual polygon for the top face — the key fix over the current approach |
| Winding detection (shoelace) | Copy the pattern from `PyramidalRoofStrategy` and `SkillionRoofStrategy`; do not duplicate the formula, extract to a shared util if it appears a third time |
| Side-wall quad pattern | Identical to `SkillionRoofStrategy` lines 88–119; consider extracting to `buildSideWalls(ring, count, isCCW, heights, positions, offset)` in `roofGeometryUtils.ts` |

The `getOBBCorners` utility is **not needed** in the new implementation — it was only used to compute the 4 rectangular base corners, which are now replaced by the actual polygon ring.

---

## 6. Edge Cases

### Square footprint
`halfLength ≤ halfWidth + 0.01` → `return new PyramidalRoofStrategy().create(params)`.

This is identical to the current fallback and is correct: the ridge degenerates to an apex.

### Very elongated footprint
`halfLength >> halfWidth`. The ridge runs almost the full length of the building. `tAlong` is large (>> 1) everywhere except near the hip ends, so it never constrains `min(tAcross, tAlong)` along the central portion. The result is a long flat ridge and steep hip triangles — correct behaviour.

### Non-convex polygon (L-shape, T-shape)
`ShapeUtils.triangulateShape` handles arbitrary simple polygons (non-convex, with no holes declared). The per-vertex height formula uses the OBB centroid and axes as a reference frame. Vertices in the "arms" of an L-shape will have large `|alongProj|` or `|acrossProj|` values relative to the OBB, causing their heights to be clamped to 0 by the `max(0, ...)` guard. This means those arms slope down to the eave — which is the correct visual result for a hipped roof on a non-convex footprint.

The approximation is conservative: it never raises a vertex above `roofHeight` and never produces inverted geometry. The error is bounded by how much the polygon deviates from its OBB along the hip faces.

### Closed vs open ring
`count = isClosedRing ? ring.length - 1 : ring.length`. The last vertex is excluded when the ring is closed (first == last). The modulo `(i+1) % count` wraps correctly in both cases.

### Ring with fewer than 3 unique vertices
Return `new BufferGeometry()` immediately after computing `count`. Avoids division-by-zero in `ShapeUtils.triangulateShape`.

### `halfWidth = 0` (degenerate flat polygon)
Guarded by `halfWidth <= 0.01` check → delegate to Pyramidal (or return empty geometry). Division by `halfWidth` is safe after this guard.

### Collinear vertices
`ShapeUtils.triangulateShape` tolerates collinear points on the contour (they produce zero-area triangles which `computeVertexNormals` handles without crashing). No special handling needed.

---

## 7. OSM / Overture Tags

| Tag | Values | Notes |
|---|---|---|
| `roof:shape` | `hipped` | Selector for this strategy |
| `roof:height` | numeric (meters) | Maps to `params.roofHeight` |
| `roof:direction` | 0–360° compass bearing | Ridge runs in this compass direction; `resolveRidgeAngle` converts to local radians |
| `roof:orientation` | `along` (default) / `across` | Whether ridge is along or across the longest OBB axis; used by `resolveRidgeAngle` when `roof:direction` is absent |

`roof:direction=0` means the ridge runs North–South (along the meridian). `resolveRidgeAngle` converts compass degrees to local Mercator radians via `π/2 - (degrees × π/180)`, which maps 0° (North) to the +Y Mercator axis.
