# Dome Roof Strategy — Implementation Plan

## 1. Shape Description

A dome (`roof:shape=dome`) is a hemispherical roof form that rises from the perimeter of a building's footprint to a single apex. It is common on:

- Religious buildings (mosques, Orthodox churches, Hindu temples, Sikh gurdwaras)
- Observatories and planetariums
- State capitols and legislative buildings
- Historic civic and palace architecture

The dome sits directly on top of the building walls with its base at wall-top level (Y=0 in roof space) and its apex at Y=`roofHeight`. For a perfectly circular tower footprint the cross-section at every height is a circle; for a non-circular footprint the cross-section should be an ellipse (or polygon-fitted shape) that matches the actual building outline at the base and converges to the same apex.

---

## 2. Current State and Problem

### Current implementation (`DomeRoofStrategy.ts`)

```typescript
const obb = computeOBB(params.outerRing);
const hL = obb.halfLength;
const hW = obb.halfWidth;
const baseRadius = Math.min(hL, hW);

const geom = new SphereGeometry(baseRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
geom.scale(hL / baseRadius, params.roofHeight / baseRadius, hW / baseRadius);
geom.rotateY(-params.ridgeAngle);
geom.translate(obb.center[0], 0, -obb.center[1]);
```

### What goes wrong

1. **OBB-only shape**: The hemisphere is stretched to the OBB rectangle. For a rectangular building this produces an ellipsoid, which is a reasonable approximation. For an L-shaped, polygonal, or non-convex footprint the dome overhangs corners that are not part of the actual building.
2. **Uniform angular scaling**: Every compass direction from the centroid gets the same XZ scale factor per axis (hL/hW). A non-rectangular building (e.g. hexagonal tower) gets an elliptical base that does not conform to its actual perimeter.
3. **`ridgeAngle` is meaningless for a dome**: A true dome is rotationally symmetric; applying `ridgeAngle` rotation only matters when the OBB is non-square. The fix should drop `ridgeAngle` entirely and instead fit to the actual polygon outline.

### When it works acceptably

- Circular or near-circular tower footprints (hL ≈ hW, OBB fits polygon well)
- Square footprints (ellipsoid approximation is visually close)

---

## 3. Algorithm

### Approach A — Footprint-fitted dome (recommended)

**Core idea:** A unit hemisphere vertex at `(x, y, z)` with `y ∈ [0,1]` lies at normalized height `t = y`. Its horizontal position is the unit direction vector `(x, z) / ‖(x,z)‖`. Instead of scaling uniformly by OBB half-extents, we look up the actual polygon's extent in that specific compass direction `theta = atan2(z, x)` and scale by that value. This makes the dome base conform precisely to the polygon edge, and every latitude ring of the dome is a scaled cross-section of that polygon outline.

**Step 1 — Build a unit upper hemisphere.**

```typescript
const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
```

- `phiStart=0`, `phiLength=2π` → full circle in XZ
- `thetaStart=0`, `thetaLength=π/2` → top half only (pole at Y=1, equator at Y=0)
- Vertices at equator (Y=0) form the base ring; vertex at pole (Y=1) is the apex

After construction, each vertex `(x, y, z)` satisfies `x² + y² + z² = 1`, so:
- `y ∈ [0, 1]` (height, normalized)
- `sinTheta = sqrt(x² + z²) = sqrt(1 - y²)` (horizontal distance from Y-axis)
- `(x, z) / sinTheta` is a unit vector in the horizontal plane

**Step 2 — Per-vertex footprint-fitted displacement.**

For each vertex `i` in the position buffer:

```
x = pos.getX(i)
y = pos.getY(i)      // 0 at equator, 1 at pole
z = pos.getZ(i)

sinTheta = sqrt(x*x + z*z)

if sinTheta < 0.001:
    // Pole vertex — stays at apex (0, roofHeight, 0)
    pos.setXYZ(i, 0, roofHeight, 0)
    continue

theta = atan2(z, x)   // compass angle in XZ plane

extent = polygonExtentAtAngle(outerRing, theta)
// extent: distance from polygon centroid to its edge in direction theta

// Unit direction in XZ scaled by extent; height scaled by roofHeight
newX = extent * (x / sinTheta)
newY = roofHeight * y
newZ = extent * (z / sinTheta)

pos.setXYZ(i, newX, newY, newZ)
```

The factor `x / sinTheta` and `z / sinTheta` give the unit direction components; multiplying by `extent` places each latitude ring at the correct polygon-conforming radius for that compass angle. Because `y` is already normalized `[0,1]` on the unit sphere, multiplying by `roofHeight` directly gives the correct height.

**Step 3 — Translate to OBB center, recompute normals.**

```typescript
const obb = computeOBB(ring);
geom.translate(obb.center[0], 0, -obb.center[1]);
geom.computeVertexNormals();
```

The ring is centroid-relative by contract (`RoofParams.outerRing` is already relative to centroid), so `obb.center` gives the offset between the centroid and the OBB center. This translation brings the dome's base into alignment with the building walls.

Note: `ridgeAngle` is not used — a dome has no ridge direction.

---

### `polygonExtentAtAngle` — detailed algorithm

**Purpose:** Given a polygon ring (centroid-relative, local Mercator XY) and a direction angle `theta`, return the distance from the origin (centroid) to the polygon boundary in that direction.

**Method:** Cast a ray `R(t) = t * (cos(theta), sin(theta))` for `t > 0` from the origin and find the smallest positive `t` at which the ray crosses a polygon edge.

```typescript
function polygonExtentAtAngle(
  ring: [number, number][],
  theta: number
): number {
  const dx = Math.cos(theta); // ray direction X
  const dy = Math.sin(theta); // ray direction Y

  // Normalize ring — skip closing duplicate vertex if present
  const count =
    ring.length > 1 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.length - 1
      : ring.length;

  let minT = Infinity;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const ax = ring[i]![0]; // edge start X
    const ay = ring[i]![1]; // edge start Y
    const bx = ring[j]![0]; // edge end X
    const by = ring[j]![1]; // edge end Y

    // Edge direction
    const ex = bx - ax;
    const ey = by - ay;

    // Solve: t*(dx,dy) = (ax,ay) + s*(ex,ey)
    // => t*dx - s*ex = ax
    // => t*dy - s*ey = ay
    // Using Cramer's rule:
    // | dx  -ex | |t|   |ax|
    // | dy  -ey | |s| = |ay|
    // det = dx*(-ey) - (-ex)*dy = -dx*ey + ex*dy
    const det = ex * dy - ey * dx;

    if (Math.abs(det) < 1e-10) continue; // ray parallel to edge

    // t = (ax*(-ey) - (-ex)*ay) / det = (ex*ay - ey*ax) / det
    const t = (ex * ay - ey * ax) / det;
    // s = (dx*ay - dy*ax) / det
    const s = (dx * ay - dy * ax) / det;

    // Valid intersection: ray goes forward (t > 0) and hits the edge segment (0 <= s <= 1)
    if (t > 1e-6 && s >= 0 && s <= 1) {
      if (t < minT) minT = t;
    }
  }

  if (minT === Infinity) {
    // No intersection found — fallback: use OBB half-width in this direction
    // This handles non-convex polygons where the ray exits and re-enters
    const obb = computeOBB(ring);
    return Math.min(obb.halfLength, obb.halfWidth);
  }

  return minT;
}
```

**Why this works:**

The ray-segment intersection solves for the scalar `t` (distance along the ray) and `s` (progress along the edge `[0,1]`). Only intersections with `t > 0` (forward along the ray) and `0 ≤ s ≤ 1` (on the edge segment, not its extension) are valid. Taking the minimum `t` gives the first polygon boundary crossing in that direction.

**Non-convex polygons:** The ray may cross multiple edges (enter and exit concavities). Taking `minT` gives the first boundary, which is the correct polygon extent for dome fitting — the dome should not extend into concave recesses.

**Fallback:** If no intersection is found (degenerate ring, or floating-point issues), fall back to the OBB's smaller half-extent to keep the dome within visible bounds.

---

### Approach B — OBB ellipsoid scaling (simpler, current behavior improved)

Keep the existing OBB-based approach but use both `halfLength` and `halfWidth` independently rather than scaling from the minimum:

```typescript
const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
geom.scale(obb.halfLength, params.roofHeight, obb.halfWidth);
geom.rotateY(-params.ridgeAngle);
geom.translate(obb.center[0], 0, -obb.center[1]);
```

This eliminates the `baseRadius = Math.min(hL, hW)` step and applies height directly without the confounded `roofHeight / baseRadius` factor. The result is a proper ellipsoidal dome that fits the OBB exactly, but still ignores the actual polygon shape.

**Acceptable for:** rectangular buildings, buildings that are close to their OBB. **Not acceptable for:** polygonal towers, irregular footprints.

Approach A is recommended; Approach B is a safe minimal fix if Approach A is deferred.

---

## 4. TypeScript Implementation Sketch

```typescript
import { BufferGeometry, SphereGeometry } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

export class DomeRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;

    // Build unit upper hemisphere: pole at Y=1, equator at Y=0
    // phiSegments=32 and thetaSegments=16 give smooth silhouette for large domes
    const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // normalized height [0..1]
      const z = pos.getZ(i);

      const sinTheta = Math.sqrt(x * x + z * z);
      if (sinTheta < 0.001) {
        // Pole: set to apex position
        pos.setXYZ(i, 0, params.roofHeight, 0);
        continue;
      }

      const theta = Math.atan2(z, x);
      const extent = polygonExtentAtAngle(ring, theta);

      pos.setXYZ(
        i,
        extent * (x / sinTheta), // XZ scaled to polygon extent in direction theta
        params.roofHeight * y,    // Y scaled to roofHeight
        extent * (z / sinTheta)
      );
    }
    pos.needsUpdate = true;

    // Translate base center to OBB center (ring is centroid-relative, not OBB-center-relative)
    const obb = computeOBB(ring);
    geom.translate(obb.center[0], 0, -obb.center[1]);

    geom.computeVertexNormals();
    return geom;
  }
}

/**
 * Returns the distance from the polygon centroid (origin) to the polygon boundary
 * in the direction specified by theta (radians, measured from +X axis in local Mercator XY).
 *
 * Uses ray-segment intersection against all polygon edges.
 * Falls back to OBB half-width if no intersection is found (degenerate/non-convex case).
 */
function polygonExtentAtAngle(ring: [number, number][], theta: number): number {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);

  // Handle closed ring (last point == first point)
  const count =
    ring.length > 1 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.length - 1
      : ring.length;

  let minT = Infinity;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const ax = ring[i]![0];
    const ay = ring[i]![1];
    const ex = ring[j]![0] - ax; // edge direction X
    const ey = ring[j]![1] - ay; // edge direction Y

    // det = ex*dy - ey*dx  (cross product of edge dir and ray dir)
    const det = ex * dy - ey * dx;
    if (Math.abs(det) < 1e-10) continue; // parallel, skip

    // t: distance along ray to intersection point
    const t = (ex * ay - ey * ax) / det;
    // s: normalized position along edge [0,1]
    const s = (dx * ay - dy * ax) / det;

    if (t > 1e-6 && s >= 0 && s <= 1 && t < minT) {
      minT = t;
    }
  }

  if (!isFinite(minT)) {
    // Fallback for degenerate rings or non-convex miss
    const obb = computeOBB(ring);
    return Math.min(obb.halfLength, obb.halfWidth);
  }

  return minT;
}
```

---

## 5. Utilities to Reuse

| Utility | Usage in dome |
|---|---|
| `computeOBB(ring)` | Center offset for final `geom.translate()`; fallback extent in `polygonExtentAtAngle` |
| `SphereGeometry` | Base hemisphere mesh (1 segment radius, upper half only) |
| `geom.computeVertexNormals()` | Recompute smooth normals after vertex displacement |

`resolveRidgeAngle` and `getOBBCorners` from `roofGeometryUtils.ts` are **not needed** — domes have no ridge.

---

## 6. Edge Cases

### Circular tower (correct fit)
A circular polygon's extent is constant at radius `r` for all `theta`. `polygonExtentAtAngle` returns `r` consistently. The dome becomes a perfect hemisphere scaled to height `roofHeight`. This is the primary use case and must be visually correct.

### Rectangular building (ellipsoidal dome)
The extent varies between `halfWidth` and `halfLength` per compass direction, producing a smooth ellipsoidal dome. This matches real-world rectangular domed buildings (e.g. some churches have an oval dome footprint).

### Very elongated building (high aspect ratio)
The dome becomes strongly ellipsoidal. `polygonExtentAtAngle` naturally handles this; no special case needed. The apex remains centered at the OBB center.

### Irregular / polygonal footprint (hexagon, octagon, etc.)
Each compass direction gets a different extent, so the base ring of the dome follows the polygon edges. The result is a dome that precisely fits the footprint — geometrically accurate for hexagonal minarets and octagonal towers.

### Non-convex polygon (L-shape, U-shape)
The ray from the centroid may exit through a concave notch before reaching the "real" outer boundary. `polygonExtentAtAngle` takes `minT` — the first crossing — which lands on the concave inward edge, not the outer wall. The dome will be pulled inward in the concave direction. This is a known limitation.

Mitigation options (not required for initial implementation):
- Pre-compute a convex hull of the ring and use it for extent calculation.
- Use `maxT` across all ray crossings (last exit), which gives the outer boundary — correct for domes on non-convex buildings.

The fallback to `Math.min(obb.halfLength, obb.halfWidth)` activates only when the ray misses all edges (degenerate ring), keeping the dome within safe bounds.

### Pole vertex (sinTheta = 0)
Three.js `SphereGeometry` generates exactly one vertex at the pole (`y=1, x=0, z=0`). The guard `sinTheta < 0.001` catches it and sets the position directly to `(0, roofHeight, 0)`. Without this guard a division-by-zero would produce `NaN` coordinates and break rendering.

### Zero or near-zero roofHeight
The dome collapses to a flat disc. This is geometrically valid and consistent with how other strategies handle `roofHeight = 0`. No special case needed.

### Ring winding direction (CW vs CCW)
`polygonExtentAtAngle` uses unsigned ray-segment intersection math; it does not depend on winding order. Both CW and CCW rings produce the same `minT` result.

### Closed ring (first == last vertex)
Handled explicitly in `polygonExtentAtAngle` by setting `count = ring.length - 1`, matching the same guard used in `computeOBB`.

---

## 7. OSM / Overture Tags

| Tag | Notes |
|---|---|
| `roof:shape=dome` | Primary selector — triggers `DomeRoofStrategy` |
| `roof:height` | Maps to `RoofParams.roofHeight` (meters). If absent, estimate from building height or use a default (e.g. `buildingHeight * 0.3`) |
| `roof:colour` / `roof:color` | Applied as material color, not geometry concern |
| `building:part` | Domes commonly appear as a building part (`building:part=yes`) sitting on top of a drum (`building:part=yes, building:shape=cylinder`) — the roof geometry is applied per-part |

`roof:angle` and `roof:direction` are not meaningful for a symmetric dome and should be ignored even if present.

---

## 8. Implementation Checklist

- [ ] Add `polygonExtentAtAngle` to `roofGeometryUtils.ts` (shared utility, reusable by cone/pyramid strategies for non-OBB fitting)
- [ ] Replace `DomeRoofStrategy.ts` body with Approach A implementation
- [ ] Remove `ridgeAngle` usage from `DomeRoofStrategy` (keep param in interface, just don't use it)
- [ ] Increase segment counts: `phiSegments=32`, `thetaSegments=16` (current 16/8 is low for large prominent domes)
- [ ] Add unit test: circular ring of radius R → all extents equal R, apex at `(obb.center[0], roofHeight, -obb.center[1])`
- [ ] Add unit test: square ring → extents vary by direction, dome fits inside ring
- [ ] Add unit test: pole vertex guard — no NaN in position buffer
- [ ] Visual QA: Hagia Sophia / Pantheon-type building in simulator
