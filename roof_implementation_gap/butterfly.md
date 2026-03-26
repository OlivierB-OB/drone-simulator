# Butterfly Roof Strategy — Implementation Plan

## 1. Shape Description

A **butterfly roof** (`roof:shape=butterfly`) is the geometric inverse of a gabled roof. Two slopes meet at a central valley (the lowest point) rather than a ridge (the highest point). The eaves — the outer edges perpendicular to the ridge axis — are the highest points. The centre runs as a valley at the wall-top level. In cross-section the profile is a "V" shape.

Modern architecture uses this form for dramatic visual effect and to channel rainwater to a central drain. The style is common in mid-century modernist buildings and contemporary residential design. The shape is also called a **V-roof**.

Key geometric properties:
- The valley line runs at `Y = 0` (wall-top level), parallel to the ridge axis.
- The two outer eave edges (at `±halfWidth` across the valley axis) are at `Y = roofHeight`.
- Each slope descends from the outer eave at `Y = roofHeight` inward to the valley at `Y = 0`.
- Heights increase with distance from the central valley axis — the inverse of a gabled roof.

OSM tags that drive this shape:

| Tag | Effect |
|-----|--------|
| `roof:shape=butterfly` | Selects this strategy |
| `roof:height` | Sets `roofHeight` in metres |
| `roof:direction` | Compass degrees → ridge/valley angle (see `resolveRidgeAngle`) |
| `roof:orientation=across` | Rotates valley axis 90° relative to OBB longest axis |

---

## 2. Current State

**Not implemented.** The key `'butterfly'` is absent from `RoofGeometryFactory.ts`. The shape is documented in OSM wiki and appears in Overture Maps data (`roof:shape=butterfly`), but `RoofGeometryFactory.create()` returns `null` for it, causing the building to render with a flat roof cap instead.

---

## 3. Algorithm

### Height convention

`roofHeight` is the height of the eaves above the wall top. The valley sits at `Y = 0` (wall-top level).

```
outer eave edges  →  Y = roofHeight
central valley    →  Y = 0
```

### Axes

From `ridgeAngle` (angle of the valley/ridge axis in local Mercator XY, radians CCW from +X):

```
acrossX = -sin(ridgeAngle)   // perpendicular-to-valley direction, X component
acrossY =  cos(ridgeAngle)   // perpendicular-to-valley direction, Y component
```

The valley runs parallel to `ridgeAngle`; the height varies across it.

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

### Step 2 — Project vertices onto the across-valley axis

For each vertex `i`:

```
acrossProj[i] = ring[i][0] * acrossX + ring[i][1] * acrossY
```

Find the maximum absolute projection across all vertices:

```
maxAbsAcross = max(|acrossProj[i]|)  for i in 0..count-1
```

If `maxAbsAcross < 0.001` (degenerate near-point polygon), treat as flat and set all heights to 0.

### Step 3 — Compute per-vertex height (butterfly formula)

```
heights[i] = roofHeight * |acrossProj[i]| / maxAbsAcross
```

- Vertices at the valley centreline (`acrossProj ≈ 0`) → `Y = 0`.
- Vertices at maximum across-distance (`|acrossProj| = maxAbsAcross`) → `Y = roofHeight`.
- All intermediate vertices interpolate linearly — this is the correct V-shape.

**Comparison with related strategies:**

| Strategy | Height formula | Shape |
|----------|---------------|-------|
| Skillion | `h * (proj - minProj) / (maxProj - minProj)` | Linear ramp, one side high |
| Gabled | `h * (1 - \|acrossProj\| / maxAbsAcross)` | Tent, centre high |
| Butterfly | `h * \|acrossProj\| / maxAbsAcross` | V, centre low |

The butterfly formula is the arithmetic complement of the gabled formula: `butterfly_height = roofHeight - gabled_height`.

### Step 4 — Top face

Triangulate the sloped top surface using `ShapeUtils.triangulateShape`. The 2D contour for triangulation is the polygon footprint in Mercator XY — the shape is unchanged, only Y-heights vary per vertex.

```
contour = [new Vector2(ring[i][0], ring[i][1])  for i in 0..count-1]
triangles = ShapeUtils.triangulateShape(contour, [])
```

`ShapeUtils.triangulateShape` normalises to CCW winding internally. Each returned triangle `[i0, i1, i2]` references indices into the original ring. Emit three 3D vertices per triangle:

```
threeX = ring[idx][0]
threeY = heights[idx]
threeZ = -ring[idx][1]
```

CCW Mercator + Z=-mercY produces upward-facing normals after `computeVertexNormals()`.

### Step 5 — Side walls

Side walls fill the gap between the flat wall top (`Y = 0`) and the sloped roof surface (`Y = heights[i]`). For the butterfly, the eave edges will have `heights[i] = roofHeight` and vertices near the valley will have `heights[i] ≈ 0` — the walls are therefore tallest at the outer edges and shortest at the centre.

This is structurally identical to `SkillionRoofStrategy`'s side wall construction. For each edge `(i, j)` where `j = (i+1) % count`:

Winding correction: the Z=-mercY mapping reverses handedness.
- CCW polygon: use edge order `(i, j)` → outward normals.
- CW polygon: swap to `(j, i)` → outward normals.

```
a = isCCW ? i : j
b = isCCW ? j : i
```

Each edge produces a quad (two triangles):

```
// Triangle 1: bottom-a, bottom-b, top-b
(ring[a][0],  0,           -ring[a][1])
(ring[b][0],  0,           -ring[b][1])
(ring[b][0],  heights[b],  -ring[b][1])

// Triangle 2: bottom-a, top-b, top-a
(ring[a][0],  0,           -ring[a][1])
(ring[b][0],  heights[b],  -ring[b][1])
(ring[a][0],  heights[a],  -ring[a][1])
```

When `heights[a] == heights[b] == 0` (both vertices on the valley line), the quad degenerates to zero height — geometrically valid, just invisible. No special casing needed.

### Step 6 — Assemble geometry

Non-indexed, flat normals — same pattern as `SkillionRoofStrategy`:

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

export class ButterflyRoofStrategy implements IRoofGeometryStrategy {
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

    // --- Step 2: Across-valley axis and projections ---
    // ridgeAngle: CCW radians from +X in local Mercator XY
    const acrossX = -Math.sin(params.ridgeAngle);
    const acrossY = Math.cos(params.ridgeAngle);

    const projections = new Float64Array(count);
    let maxAbsAcross = 0;
    for (let i = 0; i < count; i++) {
      const p = ring[i]![0] * acrossX + ring[i]![1] * acrossY;
      projections[i] = p;
      if (Math.abs(p) > maxAbsAcross) maxAbsAcross = Math.abs(p);
    }

    // --- Step 3: Per-vertex height (butterfly = inverse of gabled) ---
    const heights = new Float64Array(count);
    if (maxAbsAcross > 0.001) {
      for (let i = 0; i < count; i++) {
        // Edges high, valley low: |acrossProj| / maxAbsAcross
        heights[i] = h * Math.abs(projections[i]!) / maxAbsAcross;
      }
    }
    // maxAbsAcross <= 0.001: all heights remain 0 → flat degenerate cap

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
      positions[o++] = ring[i0]![0]; positions[o++] = heights[i0]!; positions[o++] = -ring[i0]![1];
      positions[o++] = ring[i1]![0]; positions[o++] = heights[i1]!; positions[o++] = -ring[i1]![1];
      positions[o++] = ring[i2]![0]; positions[o++] = heights[i2]!; positions[o++] = -ring[i2]![1];
    }

    // --- Step 5b: Side walls ---
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      // Swap edge direction for CW polygons to keep outward normals.
      // Z=-mercY reverses handedness: CCW Mercator → CW Three.js, so
      // for CCW polygon, (i, j) order gives outward normals; for CW, (j, i).
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: (a at Y=0), (b at Y=0), (b at Y=heights[b])
      positions[o++] = ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = 0;           positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];

      // Triangle 2: (a at Y=0), (b at Y=heights[b]), (a at Y=heights[a])
      positions[o++] = ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];
      positions[o++] = ring[a]![0]; positions[o++] = heights[a]!; positions[o++] = -ring[a]![1];
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
| `ShapeUtils.triangulateShape` | Top face triangulation | Handles convex and non-convex polygons. Input is `Vector2[]` in Mercator XY. No changes needed. |
| Shoelace winding check | Side wall normal direction | Copy verbatim from `SkillionRoofStrategy` lines 23–28. Identical logic. |
| Closed-ring detection | Vertex count | Copy verbatim from `SkillionRoofStrategy` lines 15–19. Identical logic. |
| `computeOBB` | Not used at runtime | `ridgeAngle` is resolved upstream by the caller via `resolveRidgeAngle` before `create()` is invoked. |
| `resolveRidgeAngle` | Called upstream | Converts `roof:direction` / `roof:orientation` to `ridgeAngle`. No changes needed. |

Do **not** call `computeOBB` or `getOBBCorners` inside `ButterflyRoofStrategy.create()`.

---

## 6. Comparison with SkillionRoofStrategy

The code is nearly a copy of `SkillionRoofStrategy`. The **only** difference is the height formula in Step 3:

| Strategy | Height formula |
|----------|---------------|
| Skillion | `h * (projections[i] - minProj) / (maxProj - minProj)` |
| Butterfly | `h * Math.abs(projections[i]) / maxAbsAcross` |

Skillion uses a directional linear ramp from the low side to the high side. Butterfly uses the absolute value of the across-projection, which creates a symmetric V-shape centred on the valley axis.

Everything else — closed-ring detection, winding check, `ShapeUtils.triangulateShape`, the side wall quad construction, the `Float32Array` emission loop, and the final `computeVertexNormals()` call — is identical.

---

## 7. Drain and Valley

In real buildings the valley requires a central drain or gutter. The geometry correctly places the valley at `Y = 0` along the valley axis (parallel to `ridgeAngle`). OSM data does not encode drain positions; they are implicit in the shape. No special geometry is needed for this — the lowest point of the top face is already at `Y = 0` along the valley line.

---

## 8. Edge Cases

### Near-circular or very small footprint (`maxAbsAcross < 0.001`)
All heights remain 0. The top face is a flat cap at wall-top level. Side walls are zero-height. The geometry is valid but visually a flat roof. This is the correct conservative fallback.

### Non-convex polygon (L-shape, U-shape, T-shape)
`ShapeUtils.triangulateShape` handles arbitrary simple polygons including non-convex ones. The height formula is purely per-vertex and does not assume convexity. Interior re-entrant vertices receive heights consistent with their across-projection magnitude, producing a correct V-shape over the actual footprint.

### CCW vs. CW winding
OSM/Overture data does not enforce a winding convention. The shoelace test determines orientation at runtime. The `a = isCCW ? i : j` swap in the side wall loop corrects outward normal direction after the Z=-mercY handedness flip. The top face winding is normalised internally by `ShapeUtils.triangulateShape`.

### Closed vs. open ring
Both forms appear in real data. The closed-ring check (`ring[0] === ring[ring.length-1]`) and the `count = isClosedRing ? ring.length - 1 : ring.length` guard handle both. Identical to `SkillionRoofStrategy`.

### `roofHeight == 0`
All `heights[i] = 0`. Top face is flat at Y=0. Side walls are zero-height. Geometry is valid but visually a flat cap. Correct fallback.

### Valley exactly at a vertex (`acrossProj[i] == 0`)
That vertex gets `heights[i] = 0`. It lies on the valley line. Adjacent side wall quads have zero height at that vertex and non-zero height at the neighbouring vertex, forming a valid non-degenerate triangle.

### Valley line coinciding with a full edge
If two adjacent vertices both have `acrossProj ≈ 0`, their shared side wall quad has zero height — the quad degenerates to a line (invisible). This is geometrically correct and does not cause errors.

---

## 9. OSM / Overture Tags

| Tag | Type | Description |
|-----|------|-------------|
| `roof:shape=butterfly` | string | Selects this strategy. |
| `roof:height` | number (metres) | Maps to `params.roofHeight`. Height of the eaves above wall top. |
| `roof:direction` | number (compass degrees, 0=North, CW) | Direction the valley faces (i.e. the across direction). Converted to ridge angle: `ridgeAngle = π/2 - (roofDirection × π/180)`. |
| `roof:orientation=across` | string | Valley runs across the short axis instead of the long axis: `ridgeAngle = obbAngle + π/2`. |
| `roof:orientation=along` | string (default) | Valley runs along the long axis (default when neither tag is set). |

Tag resolution is handled by `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` in `roofGeometryUtils.ts` — no changes needed there.

---

## 10. Registration

Add to `src/features/building/RoofGeometryFactory.ts`:

```typescript
import { ButterflyRoofStrategy } from './roofStrategies/ButterflyRoofStrategy';

// Inside the strategies Map constructor:
['butterfly', new ButterflyRoofStrategy()],
```

Full updated map (showing insertion point alongside the other two-slope strategies):

```typescript
private readonly strategies = new Map<string, IRoofGeometryStrategy>([
  ['pyramidal', new PyramidalRoofStrategy()],
  ['cone', new ConeRoofStrategy()],
  ['gabled', new GabledRoofStrategy()],
  ['hipped', new HippedRoofStrategy()],
  ['skillion', new SkillionRoofStrategy()],
  ['butterfly', new ButterflyRoofStrategy()],   // <-- add here
  ['dome', new DomeRoofStrategy()],
  ['onion', new OnionRoofStrategy()],
]);
```

The file lives at: `src/features/building/RoofGeometryFactory.ts`
The new strategy file should be placed at: `src/features/building/roofStrategies/ButterflyRoofStrategy.ts`
