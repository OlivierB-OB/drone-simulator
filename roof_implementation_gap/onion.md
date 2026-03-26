# Onion Roof Strategy — Implementation Plan

## 1. Shape Description

An onion dome is a bulbous, onion-shaped roof that is wider at roughly 30% of its height than at its base, then tapers to a pointed apex. The silhouette curves outward from the base, reaches maximum girth around one-third of the way up, and then curves back inward and narrows to a spire-like tip.

Common in:
- Russian Orthodox churches (characteristic gold or colored domes)
- Islamic architecture (mosques, mausoleums — e.g., the Taj Mahal)
- Central Asian and Eastern European vernacular religious buildings

OSM/Overture tags: `roof:shape=onion`, `roof:height`.

---

## 2. Current State and Problem

The existing `OnionRoofStrategy` uses `SphereGeometry` with a vertex-level bulge profile modification, then applies a uniform OBB (oriented bounding box) scale to fit the footprint:

```typescript
const geom = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
// ... bulge profile applied per vertex ...
geom.scale(hL / baseRadius, params.roofHeight, hW / baseRadius); // OBB scaling
geom.rotateY(-params.ridgeAngle);
geom.translate(obb.center[0], 0, -obb.center[1]);
```

**The problem** is identical to the dome strategy: `geom.scale(hL, roofHeight, hW)` applies a uniform elliptical warp based on OBB half-extents, ignoring the actual polygon footprint shape. For non-rectangular footprints (L-shaped, octagonal, circular, irregular), the scaled geometry will protrude through walls or leave gaps.

**What is good and must be preserved:** the per-vertex bulge profile modification. The math:
```
bulge = 1 + 0.35 * sin(t * π)
taper = 1 - t * 0.2
xzScale = taper * bulge
```
...is architecturally correct and should be kept exactly as-is; only the footprint fitting needs to be replaced.

---

## 3. Algorithm

The onion dome is architecturally identical to the dome strategy except for the vertex profile modification. The fix is the same: replace OBB scaling with footprint-fitted per-vertex scaling using `polygonExtentAtAngle`.

### Step 1 — Build Unit Upper Hemisphere

```
geom = new SphereGeometry(1, 32, 16, 0, 2π, 0, π/2)
```

This produces vertices on a unit hemisphere. At the equator (y=0), `sqrt(x²+z²) = 1`. At the pole (y=1), `x=z=0`. Y runs from 0 (equator) to 1 (pole).

Use higher subdivisions than the current implementation (32 longitude segments, 16 latitude segments) to give the bulge profile enough resolution for a smooth silhouette.

### Step 2 — Apply Onion Bulge Profile (Before Footprint Fitting)

For each vertex `(x, y, z)` on the unit hemisphere:

```
t = y                                   // height parameter, range [0..1]
bulge = 1 + 0.35 * sin(t * π)          // peaks at t=0.5 (~30% visual height)
taper = 1 - t * 0.2                     // slight narrowing toward apex
xzScale = taper * bulge
x *= xzScale
z *= xzScale
```

After this step each vertex's XZ encodes the "onion-profiled" radius at that height. The horizontal distance from the pole axis is:

```
r_profiled = sqrt(x² + z²)
```

At the equator (t=0): `bulge=1, taper=1, xzScale=1` → `r_profiled = 1` (unchanged from unit sphere).
At the midpoint (t=0.5): `bulge≈1.35, taper=0.9, xzScale≈1.215` → widest point.
At the pole (t=1): `x=z=0` regardless of scale (degenerate point).

### Step 3 — Apply Footprint Fitting (Per-Vertex Angular Scaling)

Replace the uniform OBB `geom.scale(hL, h, hW)` call with a per-vertex radial scale derived from the actual polygon footprint.

For each modified vertex `(x, y, z)` from Step 2:

```
r_profiled = sqrt(x² + z²)

if r_profiled > 0.001:
    theta = atan2(z, x)              // compass direction in Mercator XY plane
    r_base = 1.0                     // at t=0, xzScale=1, so equator radius = 1
    r_poly(theta) = polygonExtentAtAngle(ring, theta)
    scale = r_poly(theta) / r_base   // = r_poly(theta)
    newX = x * scale                 // preserves angular direction and profile shape
    newZ = z * scale
else:
    newX = 0, newZ = 0              // pole vertex: apex, no horizontal displacement

newY = y * roofHeight
```

**Why this works:** At any given height `t`, the ratio `r_profiled / r_base` captures the bulge profile shape relative to the equator. Multiplying the polygon extent by this same ratio would double-scale. Instead, we note that after Step 2, `x` and `z` already encode `sin(theta) * r_profiled` and `cos(theta) * r_profiled`. Scaling by `r_poly(theta) / r_base` uniformly rescales the whole column in that angular direction, so every height level gets `r_poly(theta) * (taper * bulge at that t)` — exactly the profile shape fitted to the footprint.

### Step 4 — Translate to OBB Center

```
geom.translate(obb.center[0], 0, -obb.center[1])
```

No `rotateY` needed: `polygonExtentAtAngle` works in Mercator XY which is already centroid-relative, so angular directions are correct without rotation.

No `geom.scale()` call: all scaling is absorbed into the per-vertex loop.

---

## 4. TypeScript Sketch

```typescript
import { SphereGeometry, BufferGeometry } from 'three';
import { computeOBB } from '../util/obb';
import { polygonExtentAtAngle } from '../util/roofGeometryUtils';
import { IRoofGeometryStrategy, RoofParams } from '../RoofGeometryStrategy';

export class OnionRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;
    const obb = computeOBB(ring);

    // Step 1: Unit upper hemisphere, higher resolution for smooth bulge
    const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const pos = geom.attributes.position!;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      const y = pos.getY(i); // [0..1]: 0 = equator, 1 = pole
      let z = pos.getZ(i);

      // Step 2: Apply onion bulge profile
      const bulge = 1 + 0.35 * Math.sin(y * Math.PI);
      const taper = 1 - y * 0.2;
      const xzScale = taper * bulge;
      x *= xzScale;
      z *= xzScale;

      // Step 3: Fit to actual polygon footprint
      const r = Math.sqrt(x * x + z * z);
      if (r > 0.001) {
        const theta = Math.atan2(z, x);
        const extent = polygonExtentAtAngle(ring, theta);
        // r_base at equator (y=0) is 1.0, so scale = extent / 1.0 = extent
        x = (x / r) * extent * xzScale; // direction * polygon_extent * profile_ratio
        z = (z / r) * extent * xzScale;
        // Simplified: since x = sin_component * xzScale and z = cos_component * xzScale:
        // x_new = (x_unit_dir) * extent * xzScale where x_unit_dir = x/(xzScale) / r_unit
        // More directly:
        const rUnit = r / xzScale; // recover unit-sphere horizontal radius at this latitude
        x = (x / r) * extent * (r / rUnit); // = direction * extent * xzScale / 1
        z = (z / r) * extent * (r / rUnit);
        // Cleaner equivalent:
        // const dirX = x / r, dirZ = z / r;
        // const profileRatio = r; // r = xzScale * rUnit = xzScale * sin(lat on sphere)
        // x = dirX * extent * profileRatio / 1 ... this gets complex; see note below
      } else {
        x = 0;
        z = 0; // pole / apex
      }

      pos.setXYZ(i, x, y * h, z);
    }

    pos.needsUpdate = true;

    // Step 4: Translate to footprint center
    geom.translate(obb.center[0], 0, -obb.center[1]);
    geom.computeVertexNormals();
    return geom;
  }
}
```

**Implementation note — cleaner vertex loop:** The algebra above gets tangled when written inline. The cleanest correct form is:

```typescript
for (let i = 0; i < pos.count; i++) {
  const xUnit = pos.getX(i); // unit sphere x, equals sin(phi)*cos(theta)
  const y     = pos.getY(i); // unit sphere y, equals cos(phi), [0..1]
  const zUnit = pos.getZ(i); // unit sphere z, equals sin(phi)*sin(theta)

  const sinPhi = Math.sqrt(xUnit * xUnit + zUnit * zUnit); // horizontal radius on unit sphere

  if (sinPhi > 0.001) {
    const theta = Math.atan2(zUnit, xUnit);        // angular direction (preserved)

    // Profile scale: what the radius becomes at this height relative to unit equator
    const bulge = 1 + 0.35 * Math.sin(y * Math.PI);
    const taper = 1 - y * 0.2;
    const profileRatio = (taper * bulge) * sinPhi; // radius after profile, relative to unit equator (=1)

    // Footprint extent in this direction
    const extent = polygonExtentAtAngle(ring, theta);

    // Final radius = extent * (profileRatio / sinPhi_at_equator)
    // sinPhi_at_equator on unit sphere = 1, so final = extent * taper * bulge * sinPhi
    const finalR = extent * taper * bulge * sinPhi;

    pos.setXYZ(i, Math.cos(theta) * finalR, y * h, Math.sin(theta) * finalR);
  } else {
    pos.setXYZ(i, 0, y * h, 0);
  }
}
```

This is the correct, clean form. At `y=0` (equator, `sinPhi=1`): `finalR = extent * 1 * 1 * 1 = extent` — the base exactly touches the polygon boundary. At mid-height: `finalR = extent * taper * bulge * sinPhi` — bulge profile applied proportionally. At pole: apex at `(0, roofHeight, 0)`.

---

## 5. `polygonExtentAtAngle` Utility

This function shoots a ray from the polygon centroid (origin of `outerRing`, since ring coords are centroid-relative) in direction `(cos theta, sin theta)` in Mercator XY, and returns the distance to the nearest polygon boundary intersection.

### Ray-Segment Intersection Math

Ray: `P(t) = t * (cos theta, sin theta)` for `t >= 0`.

For each edge of the polygon from point `A = (ax, ay)` to `B = (bx, by)`:

Parametric edge: `Q(s) = A + s*(B - A)` for `s in [0, 1]`.

Set `P(t) = Q(s)`:
```
t * cos(theta) = ax + s * (bx - ax)
t * sin(theta) = ay + s * (by - ay)
```

Solve for `t` and `s` using Cramer's rule. Let:
```
dx = bx - ax
dy = by - ay
denom = cos(theta) * dy - sin(theta) * dx
```

If `|denom| < epsilon`: ray is parallel to edge, skip.

Otherwise:
```
s = (cos(theta) * ay - sin(theta) * ax) / denom
  = (ay * cos(theta) - ax * sin(theta)) / denom

t = (ax * dy - ay * dx) / denom
  = (ax * (by - ay) - ay * (bx - ax)) / denom
```

Accept intersection if `s in [0, 1]` and `t > 0`.

Return the minimum positive `t` across all edges.

### TypeScript Implementation

```typescript
/**
 * Returns the distance from the polygon centroid to the polygon boundary
 * in the direction given by `theta` (radians, Mercator XY plane).
 *
 * `ring` must be centroid-relative (as provided by RoofParams.outerRing).
 * Fallback: OBB half-length if no intersection found (concave edge case).
 */
export function polygonExtentAtAngle(
  ring: [number, number][],
  theta: number,
  fallback?: number
): number {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const EPSILON = 1e-10;

  let minT = Infinity;

  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];

    const dx = bx - ax;
    const dy = by - ay;

    const denom = cosT * dy - sinT * dx;
    if (Math.abs(denom) < EPSILON) continue; // parallel

    const s = (ay * cosT - ax * sinT) / denom;
    if (s < -EPSILON || s > 1 + EPSILON) continue; // outside edge segment

    const t = (ax * dy - ay * dx) / denom;
    if (t > EPSILON && t < minT) {
      minT = t;
    }
  }

  if (minT === Infinity) {
    // Fallback for concave polygons where ray exits through a non-adjacent edge
    return fallback ?? 1.0;
  }

  return minT;
}
```

**Why `s` uses `[0,1]` and not strict equality:** floating-point edge cases at polygon vertices. The epsilon tolerance avoids missing intersections at corners.

---

## 6. Utilities to Reuse

| Utility | Source | Usage |
|---|---|---|
| `computeOBB(ring)` | existing | Extract `obb.center` for final translation only (not for scaling) |
| `SphereGeometry` | Three.js | Unit hemisphere base geometry |
| `polygonExtentAtAngle` | **new, shared** | Extract to `src/visualization/mesh/util/roofGeometryUtils.ts` |

### Sharing `polygonExtentAtAngle`

Both `DomeRoofStrategy` and `OnionRoofStrategy` need `polygonExtentAtAngle`. It must be extracted to a shared utility module, not duplicated:

```
src/visualization/mesh/util/roofGeometryUtils.ts
  └── export function polygonExtentAtAngle(ring, theta, fallback?): number
```

Both strategies import from there. This satisfies DRY and makes the utility independently testable.

---

## 7. Edge Cases

| Case | Behavior |
|---|---|
| **Circular building** | `polygonExtentAtAngle` returns near-constant `r` at all angles → smooth circular dome with bulge profile intact |
| **Pole vertex** (`sinPhi <= 0.001`) | Set `x=0, z=0` directly; `y * h` gives apex at `(0, roofHeight, 0)` |
| **Concave polygon** | Ray from centroid may exit through a re-entrant edge or miss entirely; fallback to OBB `halfLength` — acceptable degradation |
| **Very small building** | `extent` may be very small but geometry remains valid; consider a minimum clamp: `Math.max(extent, 0.1)` to avoid degenerate triangles |
| **`roofHeight = 0`** | All `y * h = 0`; flat degenerate mesh. Guard upstream or clamp: `Math.max(h, 0.01)` |
| **Ring winding order** | `polygonExtentAtAngle` is winding-order agnostic — intersections are found regardless of CW/CCW |

---

## 8. OSM / Overture Tags

| Tag | Value | Notes |
|---|---|---|
| `roof:shape` | `onion` | Triggers this strategy |
| `roof:height` | numeric (meters) | Maps to `params.roofHeight` |

**Typical buildings:**
- Russian Orthodox churches: gold/blue onion domes, often clustered in groups of 5
- Islamic mosques and mausoleums: marble or tiled onion domes (Mughal architecture)
- Decorative turrets on European castles and palaces
