# Saltbox Roof — Implementation Plan

## 1. Shape Description

A saltbox roof is an asymmetric gabled roof where the ridge is not centered over the footprint. One slope is short and steep; the other is long and gentle, sometimes extending all the way down to a lower eave on the opposite side. The name comes from New England colonial saltbox houses, where a rear lean-to addition pushed the back slope down much further than the front.

Visually: from the gable end, the silhouette is an asymmetric triangle, not an isoceles one. The ridge sits closer to one eave than the other.

Key distinguishing property: **the ridge is displaced along the across-ridge axis by an offset `d` from the OBB centerline**. This single parameter differentiates saltbox from gabled (`d = 0`).

OSM tag: `roof:shape=saltbox`

---

## 2. Current State

**Not implemented.** `RoofGeometryFactory` lists no `'saltbox'` entry. No `SaltboxRoofStrategy` class exists anywhere in the codebase. The shape is referenced in `PITCHED_SHAPES` (or equivalent tag-handling code) but falls through to `null` at creation time.

---

## 3. Algorithm

### 3.1 OBB Frame Setup

```
obb = computeOBB(outerRing)
ridgeAngle = params.ridgeAngle   // along-ridge direction, radians

Along-ridge unit vector (Mercator XY):
  alongX = cos(ridgeAngle)
  alongY = sin(ridgeAngle)

Across-ridge unit vector (Mercator XY, 90° CCW from along):
  acrossX = -sin(ridgeAngle)
  acrossY =  cos(ridgeAngle)
```

`obb.halfLength` = half-extent along the ridge.
`obb.halfWidth`  = half-extent across the ridge (total width = 2 × halfWidth).

### 3.2 Ridge Offset

The ridge is displaced by `ridgeOffset` in the `+across` direction from the OBB centerline:

```
ridgeOffset = obb.halfWidth * RIDGE_OFFSET_FRACTION   // default: 0.3
```

This produces two unequal slope widths:

```
halfWidth_short = obb.halfWidth - ridgeOffset   // from ridge to +across eave (short, steep side)
halfWidth_long  = obb.halfWidth + ridgeOffset   // from ridge to -across eave (long, gentle side)
```

`roof:direction` (compass degrees, 0 = North, CW) controls which side is the long slope. When provided, it indicates the compass direction the **long slope faces** (i.e., the direction away from the ridge toward the far eave). Convert to a Mercator unit vector and compare against `+across` and `-across` to decide the sign of `ridgeOffset`. If the long-slope direction aligns better with `-across`, flip `ridgeOffset` to negative (shifting the ridge toward `-across` instead).

### 3.3 OBB-Based Geometry (Rectangular Footprint)

For a rectangular footprint, the geometry has **6 vertices** and **4 faces** — identical in count to gabled, with the ridge shifted off-center.

**Ridge endpoints in Three.js space** (X = mercX, Y = height, Z = -mercY):

```
cx = obb.center[0]
cz = -obb.center[1]
hL = obb.halfLength

// Along-ridge direction mapped to Three.js XZ:
alongThreeX =  cos(ridgeAngle)
alongThreeZ = -sin(ridgeAngle)

// Across-ridge direction mapped to Three.js XZ:
acrossThreeX = -sin(ridgeAngle)
acrossThreeZ = -cos(ridgeAngle)

R0 = ( cx + hL*alongThreeX + ridgeOffset*acrossThreeX,  h,  cz + hL*alongThreeZ + ridgeOffset*acrossThreeZ )
R1 = ( cx - hL*alongThreeX + ridgeOffset*acrossThreeX,  h,  cz - hL*alongThreeZ + ridgeOffset*acrossThreeZ )
```

**Base corners** from `getOBBCorners(obb, ridgeAngle)`:

```
C0: +along +across, Y=0
C1: +along -across, Y=0
C2: -along -across, Y=0
C3: -along +across, Y=0
```

**Vertex array** (indices 0–5):

| Index | Vertex | Position |
|-------|--------|----------|
| 0 | C0 | +along +across base |
| 1 | C1 | +along -across base |
| 2 | C2 | -along -across base |
| 3 | C3 | -along +across base |
| 4 | R0 | +along ridge (offset) |
| 5 | R1 | -along ridge (offset) |

**Face index list** (same winding convention as `GabledRoofStrategy`):

```typescript
const indices = [
  // Short slope (+across side — steep): trapezoid C3, C0, R0, R1
  4, 0, 3,   // tri 1
  5, 4, 3,   // tri 2
  // Long slope (-across side — gentle): trapezoid C1, C2, R1, R0
  5, 2, 1,   // tri 1
  4, 5, 1,   // tri 2
  // Gable end +along: asymmetric triangle R0, C0, C1
  4, 1, 0,
  // Gable end -along: asymmetric triangle R1, C3, C2
  5, 3, 2,
];
```

These index triples are identical to `GabledRoofStrategy` — only the positions of R0/R1 differ (offset from center).

Use `BufferGeometry` + `setIndex` + `computeVertexNormals()`, same as gabled/hipped.

### 3.4 Per-Vertex Height (Non-Rectangular Footprint)

For arbitrary polygon footprints, use the same per-vertex projection approach as `SkillionRoofStrategy`.

Project each vertex onto the across-ridge axis, then compute its height based on which side of the (offset) ridge it sits on:

```
acrossProj[i] = ring[i][0] * acrossX + ring[i][1] * acrossY

if acrossProj[i] >= ridgeOffset:
  // +across side: short steep slope, distance from ridge = acrossProj[i] - ridgeOffset
  heights[i] = h * max(0, 1 - (acrossProj[i] - ridgeOffset) / halfWidth_short)

else:
  // -across side: long gentle slope, distance from ridge = ridgeOffset - acrossProj[i]
  heights[i] = h * max(0, 1 - (ridgeOffset - acrossProj[i]) / halfWidth_long)
```

`max(0, ...)` clamps vertices that project outside the OBB to eave level, preventing negative heights on unusual footprints.

Then:
1. Triangulate the top face: build a `Vector2[]` contour from `ring`, call `ShapeUtils.triangulateShape(contour, [])`, emit non-indexed triangles with per-vertex heights.
2. Emit side walls: for each edge `(i, j)`, emit a quad between `(Y=0, Y=0, Y=heights[j], Y=heights[i])`, with winding corrected by `isCCW` exactly as in `SkillionRoofStrategy`.

Three.js coordinate mapping throughout: `X = ring[i][0]`, `Y = heights[i]`, `Z = -ring[i][1]`.

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';

export class SaltboxRoofStrategy implements IRoofGeometryStrategy {
  private readonly RIDGE_OFFSET_FRACTION = 0.3;

  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;
    const obb = computeOBB(ring);

    // --- Ring bookkeeping (mirrors SkillionRoofStrategy) ---
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

    // --- Ridge offset ---
    const ridgeOffset = obb.halfWidth * this.RIDGE_OFFSET_FRACTION;
    const halfWidth_short = obb.halfWidth - ridgeOffset;
    const halfWidth_long  = obb.halfWidth + ridgeOffset;

    // Across-ridge direction in Mercator XY
    const acrossX = -Math.sin(params.ridgeAngle);
    const acrossY =  Math.cos(params.ridgeAngle);

    // --- Per-vertex heights ---
    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const acrossProj = ring[i]![0] * acrossX + ring[i]![1] * acrossY;
      if (acrossProj >= ridgeOffset) {
        heights[i] = h * Math.max(0, 1 - (acrossProj - ridgeOffset) / halfWidth_short);
      } else {
        heights[i] = h * Math.max(0, 1 - (ridgeOffset - acrossProj) / halfWidth_long);
      }
    }

    // --- Top face triangulation ---
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    // --- Allocate position buffer ---
    const topTriCount  = triangles.length;
    const sideTriCount = count * 2;
    const positions    = new Float32Array((topTriCount + sideTriCount) * 3 * 3);
    let o = 0;

    // Top face
    for (const tri of triangles) {
      for (const vi of tri) {
        positions[o++] =  ring[vi]![0];
        positions[o++] =  heights[vi]!;
        positions[o++] = -ring[vi]![1];
      }
    }

    // Side walls
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: bottom-a, bottom-b, top-b
      positions[o++] =  ring[a]![0]; positions[o++] = 0;          positions[o++] = -ring[a]![1];
      positions[o++] =  ring[b]![0]; positions[o++] = 0;          positions[o++] = -ring[b]![1];
      positions[o++] =  ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];

      // Triangle 2: bottom-a, top-b, top-a
      positions[o++] =  ring[a]![0]; positions[o++] = 0;           positions[o++] = -ring[a]![1];
      positions[o++] =  ring[b]![0]; positions[o++] = heights[b]!; positions[o++] = -ring[b]![1];
      positions[o++] =  ring[a]![0]; positions[o++] = heights[a]!; positions[o++] = -ring[a]![1];
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

Note: the sketch uses the per-vertex approach for all footprints (including rectangular ones). This is correct and simpler than branching between OBB-indexed and per-vertex paths. The OBB-based indexed approach (Section 3.3) is documented for conceptual clarity and could be used as a fast path for rectangular footprints if profiling warrants it.

---

## 5. Utilities to Reuse

| Utility | Source | Purpose |
|---------|--------|---------|
| `computeOBB(ring)` | `roofGeometryUtils.ts` | Get halfWidth for ridge offset calculation |
| `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` | `roofGeometryUtils.ts` | Resolve ridgeAngle from OSM tags before calling `create()` |
| `getOBBCorners(obb, ridgeAngle)` | `roofGeometryUtils.ts` | Optional: fast path for rectangular footprints |
| `ShapeUtils.triangulateShape(contour, [])` | Three.js | Top face triangulation for arbitrary polygons |
| Winding detection (shoelace) | Inline (copied from `SkillionRoofStrategy`) | Correct side wall normal orientation |

`resolveRidgeAngle` is called by the factory or caller before `create()` — `RoofParams.ridgeAngle` arrives already resolved.

---

## 6. Edge Cases

**`ridgeOffset = 0`**: `halfWidth_short === halfWidth_long === halfWidth`. Both slope height formulas reduce to the same expression, producing a symmetric gabled roof. Behavior is identical to `GabledRoofStrategy`.

**`ridgeOffset >= halfWidth` (degenerate)**: `halfWidth_short <= 0`. The short side collapses to zero width — division by zero or negative heights. Guard with:
```typescript
const ridgeOffset = Math.min(obb.halfWidth * this.RIDGE_OFFSET_FRACTION, obb.halfWidth * 0.9);
```
This caps the offset at 90% of halfWidth, keeping a sliver of short slope.

**`halfWidth_short` very small** (tall narrow spike on short side): `max(0, ...)` in the height formula prevents negative values. The short slope will be very steep but geometrically valid.

**`roof:direction` tag**: Compass degrees (0 = North, CW). Indicates the direction the **long slope faces** — i.e., the direction from the ridge toward the far eave. Implementation: compute the Mercator unit vector for the given compass bearing, dot it against `+acrossDir` and `-acrossDir`, and assign `ridgeOffset` positive (toward `+across`) if the long slope faces `-across`, or negative (toward `-across`) if the long slope faces `+across`. In practice, `resolveRidgeAngle` with a `roofDirection` already rotates `ridgeAngle` to align with the building direction — the offset sign may need separate handling beyond what `resolveRidgeAngle` provides.

**Non-rectangular footprint**: the per-vertex projection approach handles this correctly by design. Convex and concave polygons both work. `ShapeUtils.triangulateShape` handles the top face; side walls iterate all edges.

**Closed vs open ring**: detected via `isClosedRing` check on first/last point equality. `count` excludes the duplicate closing vertex.

---

## 7. OSM / Overture Tags

| Tag | Values | Meaning |
|-----|--------|---------|
| `roof:shape` | `saltbox` | Selects this strategy |
| `roof:height` | meters (float) | Maps to `params.roofHeight` |
| `roof:direction` | 0–360 compass degrees | Direction the long slope faces; controls ridge offset sign |

`roof:direction` is the only saltbox-specific tag beyond the shape identifier. The ridge offset fraction (0.3) is a hardcoded default with no OSM equivalent.

---

## 8. Registration

**Step 1** — Create the file:
```
src/features/building/roofStrategies/SaltboxRoofStrategy.ts
```

**Step 2** — Add to `RoofGeometryFactory.ts`:

```typescript
// Add import:
import { SaltboxRoofStrategy } from './roofStrategies/SaltboxRoofStrategy';

// Add to strategies Map:
['saltbox', new SaltboxRoofStrategy()],
```

The `strategies` Map in `RoofGeometryFactory` uses `params.roofShape` as the key. The tag value `saltbox` maps directly; no normalization needed as long as the Overture/OSM parser lowercases shape names before passing them in.

**Step 3** — Verify the parser passes `roofShape: 'saltbox'` (check `OvertureParser.ts` or equivalent building feature parser for the `roof:shape` field mapping).
