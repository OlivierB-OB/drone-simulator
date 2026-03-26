# Gabled Roof Strategy — Implementation Plan

## 1. Shape Description

A **gabled roof** (`roof:shape=gabled`) has two planar slopes meeting at a central horizontal ridge. The ridge runs along the building's longest axis. At each short end, a vertical triangular face (the **gable end**) fills the gap between the ridge and the base. In cross-section, the profile is an isoceles triangle.

Key geometric properties:
- The ridge is at `Y = roofHeight`, centred over the footprint's longest axis.
- All base perimeter vertices sit at `Y = 0`.
- Each base vertex rises linearly to `Y = roofHeight` as its perpendicular distance to the ridge centreline (`acrossProj`) approaches zero.
- The ridge itself spans the full along-axis extent of the footprint.

OSM tags that drive this shape:
| Tag | Effect |
|-----|--------|
| `roof:shape=gabled` | Selects this strategy |
| `roof:height` | Sets `roofHeight` in metres |
| `roof:direction` | Compass degrees → ridge angle (see `resolveRidgeAngle`) |
| `roof:orientation=across` | Rotates ridge 90° relative to OBB longest axis |

---

## 2. Current State and Problem

The current `GabledRoofStrategy` hard-codes a 4-corner OBB rectangle:

```typescript
const obb = computeOBB(params.outerRing);
const corners = getOBBCorners(obb, params.ridgeAngle); // 4 corners only
// builds 6 vertices: 4 base + 2 ridge endpoints
// indices assemble two rectangular slopes + two gable triangles
```

**Consequence:** For any non-rectangular footprint (L-shaped, T-shaped, U-shaped, curved, stepped), the roof geometry is a rectangle that does not match the actual building outline. The overhanging or missing portions are visually incorrect and cause z-fighting with the wall geometry.

**Root cause:** `getOBBCorners` discards all polygon vertices beyond the bounding box corners. The footprint shape is completely ignored.

---

## 3. Algorithm

### Axes

From `ridgeAngle` (angle of the ridge in local Mercator XY, radians CCW from +X):

```
alongX = cos(ridgeAngle)      // ridge direction X component
alongY = sin(ridgeAngle)      // ridge direction Y component
acrossX = -sin(ridgeAngle)    // perpendicular-to-ridge X component
acrossY =  cos(ridgeAngle)    // perpendicular-to-ridge Y component
```

Three.js output mapping: `threeX = mercX`, `threeY = height`, `threeZ = -mercY`.

### Step 1 — Normalise the ring

```
isClosedRing = (ring[0] === ring[ring.length-1])
count = isClosedRing ? ring.length - 1 : ring.length
```

Compute signed area (shoelace) to determine winding:

```
signedArea = Σ (ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1])   for j = (i+1)%count
isCCW = signedArea > 0
```

### Step 2 — Project vertices onto the across-ridge axis

For each vertex `i`:

```
acrossProj[i] = ring[i][0] * acrossX + ring[i][1] * acrossY
```

Find the maximum absolute projection:

```
maxAbsAcross = max(|acrossProj[i]|)  for i in 0..count-1
```

If `maxAbsAcross < 1e-6` (degenerate flat polygon), set all heights to 0 and skip the roof surface entirely (return empty geometry or a flat cap).

### Step 3 — Compute per-vertex roof height

Each vertex is lifted by an amount proportional to how close it is to the ridge centreline:

```
roofY[i] = roofHeight * (1 - |acrossProj[i]| / maxAbsAcross)
```

- Vertices at the ridge centreline (`acrossProj = 0`) reach `Y = roofHeight`.
- Vertices at the maximum across-projection reach `Y = 0` (base).
- Intermediate vertices interpolate linearly — this is the correct tent/gable shape.

Note: this differs from skillion (which uses a directional linear ramp from `minProj` to `maxProj`). The gabled formula is symmetric about the centreline.

### Step 4 — Top face

Triangulate the top face (the sloped roof surface) using `ShapeUtils.triangulateShape`. The 2D contour for triangulation is the original polygon ring in Mercator XY (the shape is unchanged; only the Y-heights vary per vertex).

```
contour = [new Vector2(ring[i][0], ring[i][1])  for i in 0..count-1]
triangles = ShapeUtils.triangulateShape(contour, [])
```

`ShapeUtils.triangulateShape` normalises to CCW winding internally. Each returned triangle `[i0, i1, i2]` references indices into the original ring. Emit three 3D vertices per triangle:

```
threeX = ring[idx][0]
threeY = roofY[idx]
threeZ = -ring[idx][1]
```

CCW Mercator + Z=-mercY preserves upward-facing normals after `computeVertexNormals()`.

### Step 5 — Side walls

For each edge `(i, j)` where `j = (i+1) % count`, emit a quad connecting the base (`Y=0`) to the roof surface (`Y=roofY`). This fills the gap between the flat wall top and the sloped roof surface.

Winding correction: the Z=-mercY mapping reverses handedness. For a CCW polygon, edge order `(i, j)` produces outward-facing normals; for CW, swap to `(j, i)`. Identical to `SkillionRoofStrategy`.

Each quad = two triangles:

```
// Let a = isCCW ? i : j,  b = isCCW ? j : i
// Triangle 1:
(ring[a][0], 0,         -ring[a][1])
(ring[b][0], 0,         -ring[b][1])
(ring[b][0], roofY[b],  -ring[b][1])

// Triangle 2:
(ring[a][0], 0,         -ring[a][1])
(ring[b][0], roofY[b],  -ring[b][1])
(ring[a][0], roofY[a],  -ring[a][1])
```

When `roofY[a] == roofY[b]` (both vertices on the same slope level), the quad is planar. When one is at 0 and the other is at a non-zero height (e.g. a gable end edge), one triangle degenerates to a triangle — this is correct.

### Step 6 — Assemble geometry

Non-indexed (flat normals, same pattern as Skillion and Pyramidal):

```
totalTriangles = triangles.length + count * 2
positions = new Float32Array(totalTriangles * 3 * 3)
// fill top face, then side walls
geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
geom.computeVertexNormals()
```

---

## 4. TypeScript Sketch

```typescript
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeUtils,
  Vector2,
} from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';

export class GabledRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;

    // --- Step 1: Normalise ring ---
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;

    // Shoelace for winding
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // --- Step 2: Across-ridge axis and projections ---
    // ridgeAngle: CCW radians from +X in local Mercator XY
    const acrossX = -Math.sin(params.ridgeAngle);
    const acrossY = Math.cos(params.ridgeAngle);

    const acrossProj = new Float64Array(count);
    let maxAbsAcross = 0;
    for (let i = 0; i < count; i++) {
      const p = ring[i]![0] * acrossX + ring[i]![1] * acrossY;
      acrossProj[i] = p;
      if (Math.abs(p) > maxAbsAcross) maxAbsAcross = Math.abs(p);
    }

    // --- Step 3: Per-vertex roof height ---
    const roofY = new Float64Array(count);
    if (maxAbsAcross > 1e-6) {
      for (let i = 0; i < count; i++) {
        roofY[i] = h * (1 - Math.abs(acrossProj[i]!) / maxAbsAcross);
      }
    }
    // If maxAbsAcross <= 1e-6: all roofY remain 0 → flat degenerate cap

    // --- Step 4: Triangulate top face ---
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    // --- Allocate position buffer ---
    const topTriCount = triangles.length;
    const sideTriCount = count * 2;
    const totalVertices = (topTriCount + sideTriCount) * 3;
    const positions = new Float32Array(totalVertices * 3);
    let o = 0;

    // --- Step 5a: Top face ---
    for (const tri of triangles) {
      const i0 = tri[0]!;
      const i1 = tri[1]!;
      const i2 = tri[2]!;
      // Three.js: X = mercX, Y = height, Z = -mercY
      positions[o++] = ring[i0]![0]; positions[o++] = roofY[i0]!; positions[o++] = -ring[i0]![1];
      positions[o++] = ring[i1]![0]; positions[o++] = roofY[i1]!; positions[o++] = -ring[i1]![1];
      positions[o++] = ring[i2]![0]; positions[o++] = roofY[i2]!; positions[o++] = -ring[i2]![1];
    }

    // --- Step 5b: Side walls ---
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      // Swap edge direction for CW polygons to keep outward normals
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: base-base-roof[b]
      positions[o++] = ring[a]![0]; positions[o++] = 0;        positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = 0;        positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0]; positions[o++] = roofY[b]!; positions[o++] = -ring[b]![1];

      // Triangle 2: base[a]-roof[b]-roof[a]
      positions[o++] = ring[a]![0]; positions[o++] = 0;        positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = roofY[b]!; positions[o++] = -ring[b]![1];
      positions[o++] = ring[a]![0]; positions[o++] = roofY[a]!; positions[o++] = -ring[a]![1];
    }

    // --- Step 6: Build geometry ---
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Utilities to Reuse

| Utility | Where used | Notes |
|---------|-----------|-------|
| `computeOBB` | Not needed at runtime | `ridgeAngle` is already resolved upstream by the caller via `resolveRidgeAngle(obb.angle, ...)` before `create()` is called. The OBB is not used inside `create()` in the new implementation. |
| `resolveRidgeAngle` | Called upstream (not inside strategy) | Converts `roof:direction` / `roof:orientation` to `ridgeAngle`. No change needed. |
| `ShapeUtils.triangulateShape` | Top face triangulation | Handles convex and non-convex polygons correctly. Input is `Vector2[]` in Mercator XY. |
| Shoelace winding check | Side wall normal direction | Copy verbatim from `SkillionRoofStrategy` or `PyramidalRoofStrategy` — identical code. |
| Closed-ring detection | Vertex count | Copy verbatim from `SkillionRoofStrategy`. |

Do **not** call `computeOBB` or `getOBBCorners` inside `GabledRoofStrategy.create()`. Those are only needed if ridge angle is unknown, which is handled before the strategy is invoked.

---

## 6. Edge Cases

### Closed vs. open ring
Standard: check `ring[0] === ring[ring.length-1]` and subtract 1 from count. Both forms appear in Overture/OSM data. The existing pattern in `SkillionRoofStrategy` and `PyramidalRoofStrategy` handles this correctly and must be copied.

### CCW vs. CW winding
OSM/Overture data has no enforced winding. The shoelace test determines orientation. The Z=-mercY mapping flips handedness, so:
- CCW Mercator polygon → edge order `(i, j)` → outward normals after Z flip.
- CW Mercator polygon → edge order `(j, i)` → same result.

The `a = isCCW ? i : j` swap in the side wall loop handles this. The top face triangulation is handled by `ShapeUtils.triangulateShape` which normalises winding internally.

### Very narrow building (`maxAbsAcross` near zero)
If the building is nearly a line (e.g. a very thin wall), `maxAbsAcross < 1e-6`. In this case all `roofY[i]` stay at 0 and the top face is flat. The side walls degenerate to zero-height quads (still geometrically valid, just invisible). No special branching needed beyond the guard.

### Degenerate polygon (fewer than 3 vertices)
`ShapeUtils.triangulateShape` returns an empty array. The top face emits nothing; side walls emit degenerate quads. The resulting geometry is empty but valid. No crash.

### Non-convex polygon (L-shape, U-shape, T-shape)
`ShapeUtils.triangulateShape` handles arbitrary simple polygons including non-convex ones. The per-vertex height formula `h * (1 - |acrossProj[i]| / maxAbsAcross)` is purely per-vertex — it does not assume convexity. Interior vertices at the concave re-entrants receive heights consistent with their across-projection distance, producing a correct tent shape over the actual footprint.

### Ridge exactly at a vertex (`acrossProj[i] == 0`)
The vertex gets `roofY[i] = roofHeight`. This is correct — it lies on the ridge. The adjacent side wall quads will have one edge at full height and one at some lower height, forming a non-degenerate triangulated quad.

### `roofHeight == 0`
All `roofY[i] = 0`. Top face is flat at Y=0. Side walls are zero-height. Geometry is valid but visually a flat cap. This is the correct fallback.

---

## 7. OSM/Overture Tags Used

| Tag | Type | Description |
|-----|------|-------------|
| `roof:shape=gabled` | string | Selects this strategy. |
| `roof:height` | number (metres) | Maps to `params.roofHeight`. |
| `roof:direction` | number (compass degrees, 0=North, CW) | Direction the roof **slopes toward** (i.e. the across direction). Converted to ridge angle: `ridgeAngle = π/2 - (roofDirection × π/180)`. |
| `roof:orientation=across` | string | Swap ridge to run across the short axis instead of the long axis: `ridgeAngle = obbAngle + π/2`. |
| `roof:orientation=along` | string (default) | Ridge runs along the long axis (default when neither `roof:direction` nor `roof:orientation` is set). |

Tag resolution is handled by `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` in `roofGeometryUtils.ts` — no changes needed there.
