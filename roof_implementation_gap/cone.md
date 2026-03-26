# Cone Roof Strategy — Implementation Plan

## 1. Shape Description

**OSM tag:** `roof:shape=cone`

A conical roof has a single apex point and a base that tapers linearly to that point. It is the canonical roof form for cylindrical structures: towers, turrets, castle elements, and round silos. The cross-section at any height is a scaled-down copy of the base outline. For a perfectly circular footprint this is a geometric cone; for an arbitrary polygon the taper still applies per-angle, producing a shape that is geometrically identical to a pyramid but with a smoother (potentially circular) base approximation.

Relevant OSM tags: `roof:shape=cone`, `roof:height`.

---

## 2. Current State

```typescript
// src/visualization/mesh/roofs/ConeRoofStrategy.ts (current)
const obb = computeOBB(params.outerRing);
const hL = obb.halfLength, hW = obb.halfWidth;
const baseRadius = Math.min(hL, hW);
const geom = new ConeGeometry(baseRadius, params.roofHeight, 16, 1, true);
geom.translate(0, params.roofHeight / 2, 0);
geom.scale(hL / baseRadius, 1, hW / baseRadius);
geom.rotateY(-params.ridgeAngle);
geom.translate(obb.center[0], 0, -obb.center[1]);
```

**What works:** For round towers (halfLength ≈ halfWidth) this is fine. The OBB is a good approximation, `openEnded: true` is correct (wall extrusion supplies the base cap), and the translate-then-scale approach is simple.

**What breaks:**
- Uniform OBB scaling stretches the cone elliptically but does not follow the actual polygon boundary. For footprints that are not close to elliptical (L-shaped towers, clipped circles, etc.) the cone silhouette visibly mismatches the wall.
- Only 16 radial segments — too coarse for a smooth circle.
- `rotateY(-params.ridgeAngle)` aligns the OBB axes but does not help non-elliptical footprints.

---

## 3. Algorithm

### Footprint classification

Compute the OBB eccentricity ratio:

```
eccentricity = halfLength / halfWidth   (always >= 1)
```

- `eccentricity < 1.2` → approximately circular tower → use **Case A** (per-vertex angular fitting with `ConeGeometry`).
- `eccentricity >= 1.2` → irregular/elongated footprint → use **Case B** (delegate to `PyramidalRoofStrategy`).

The 1.2 threshold is a tunable constant. It covers the typical OSM case where a round tower maps to a slightly non-square bounding box due to projection quantisation.

---

### Case A — Circular/regular footprint (towers)

Use `ConeGeometry` as the geometric primitive but fit each base vertex to the actual polygon boundary using **per-vertex angular fitting** (same technique as Dome/Onion strategies).

**Steps:**

1. Build a high-resolution unit cone:
   ```
   ConeGeometry(1, 1, 64, 1, true)
   ```
   `openEnded: true` — no base cap needed.

2. **Translate so that base is at Y=0, apex at Y=1.**
   Three.js `ConeGeometry` places the apex at `Y = +height/2` and the base at `Y = -height/2`. After construction the unit cone has apex at `+0.5` and base at `-0.5`. Shift by `+0.5`:
   ```
   geom.translate(0, 0.5, 0)
   ```
   Now `Y ∈ [0, 1]` where `0 = base`, `1 = apex`.

3. **Iterate over every position attribute vertex:**
   For vertex `(x, y, z)`:
   - `t = y` — normalised height in `[0, 1]`
   - `sinTheta = sqrt(x² + z²)` — radius in the XZ plane
   - If `sinTheta < 0.001`: this is the apex vertex → set to `(obb.center[0], roofHeight, -obb.center[1])` and continue.
   - `theta = atan2(z, x)` — angle in XZ plane
   - `rPoly = polygonExtentAtAngle(ring, theta)` — polygon boundary distance at this angle from centroid
   - `rAtHeight = rPoly * (1 - t)` — linear taper: full radius at base, zero at apex
   - New position:
     ```
     X = rAtHeight * cos(theta) + obb.center[0]
     Y = t * roofHeight
     Z = rAtHeight * sin(theta) - obb.center[1]
     ```
     Note the sign convention: input ring uses Mercator XY, output Z = `-mercY`.

4. Set `pos.needsUpdate = true` and call `geom.computeVertexNormals()`.

**Why this works:** The linear taper `(1 - t)` mirrors exactly what `ConeGeometry` does internally; we are only replacing the per-angle radius from a fixed `1` to `rPoly(theta)`. The apex collapses cleanly because `rAtHeight → 0` as `t → 1`.

---

### Case B — Irregular footprint

A cone over an arbitrary polygon is geometrically identical to a pyramid: the apex is at the centroid elevated to `roofHeight`, and each base edge forms a triangle with that apex. The only difference from a pyramid is that the base polygon may have many more segments (if the footprint is a smoothed circle).

**Action:** Instantiate and delegate to `PyramidalRoofStrategy`:

```typescript
return new PyramidalRoofStrategy().create(params);
```

This avoids duplicating triangle-fan logic and produces a correct result for any polygon shape.

---

### `polygonExtentAtAngle` utility

This helper must be shared with Dome and Onion strategies. It belongs in `src/visualization/mesh/roofs/roofGeometryUtils.ts`.

**Contract:**
```typescript
function polygonExtentAtAngle(ring: [number, number][], theta: number): number
```

**Algorithm:**
1. Cast a ray from the centroid (origin, since `ring` is centroid-relative) at angle `theta`.
2. Test intersection with each polygon edge.
3. Return the distance to the nearest forward intersection.
4. Fallback: if no intersection found (concave polygon edge case), return the OBB half-extent in direction `theta` — i.e., `sqrt((hL*cos(theta))² + (hW*sin(theta))²)` after rotating by `-ridgeAngle`. This prevents degenerate output.

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, ConeGeometry } from 'three';
import { computeOBB } from '../util/obb';
import { polygonExtentAtAngle } from './roofGeometryUtils';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';
import type { IRoofGeometryStrategy, RoofParams } from './types';

const CIRCULARITY_THRESHOLD = 1.2;

export class ConeRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const { outerRing: ring, roofHeight: h } = params;
    const obb = computeOBB(ring);

    // Case B: irregular footprint — delegate to pyramid
    if (obb.halfLength / obb.halfWidth >= CIRCULARITY_THRESHOLD) {
      return new PyramidalRoofStrategy().create(params);
    }

    // Case A: approximately circular — per-vertex angular fitting
    const geom = new ConeGeometry(1, 1, 64, 1, true);
    // Shift: apex at Y=+0.5, base at Y=-0.5 → apex at Y=1, base at Y=0
    geom.translate(0, 0.5, 0);

    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // 0 = base, 1 = apex after translate
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const sinTheta = Math.sqrt(x * x + z * z);

      if (sinTheta < 0.001) {
        // Apex vertex — place at centroid top
        pos.setXYZ(i, obb.center[0], h, -obb.center[1]);
        continue;
      }

      const theta = Math.atan2(z, x);
      const rPoly = polygonExtentAtAngle(ring, theta);
      const rAtHeight = rPoly * (1 - y); // linear taper

      pos.setXYZ(
        i,
        rAtHeight * Math.cos(theta) + obb.center[0],
        y * h,
        rAtHeight * Math.sin(theta) - obb.center[1],
      );
    }

    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. `polygonExtentAtAngle` — Shared Utility

Location: `src/visualization/mesh/roofs/roofGeometryUtils.ts`

This is also needed by `DomeRoofStrategy` and `OnionRoofStrategy`. Extract it there and import from all three.

```typescript
/**
 * Returns the distance from the polygon centroid (origin) to the polygon
 * boundary in the direction given by `theta` (radians, XZ plane).
 * Ring vertices are centroid-relative: [mercX, mercY].
 * Falls back to OBB half-extent if no intersection is found.
 */
export function polygonExtentAtAngle(
  ring: [number, number][],
  theta: number,
): number {
  const dx = Math.cos(theta);
  const dz = Math.sin(theta); // in Mercator Y, mapped to -Z in Three.js

  let best = Infinity;

  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    // Edge vector
    const ex = bx - ax;
    const ey = by - ay;
    // Solve: origin + t*(dx,dz) = (ax,ay) + s*(ex,ey)
    const denom = dx * ey - dz * ex;
    if (Math.abs(denom) < 1e-10) continue; // parallel
    const t = (ax * ey - ay * ex) / denom;
    const s = (ax * dz - ay * dx) / denom;
    if (t > 0 && s >= 0 && s <= 1) {
      best = Math.min(best, t);
    }
  }

  if (isFinite(best)) return best;

  // Fallback: OBB half-extent (should not normally be reached)
  const obb = computeOBB(ring);
  const localTheta = theta - obb.angle;
  return Math.sqrt(
    Math.pow(obb.halfLength * Math.cos(localTheta), 2) +
    Math.pow(obb.halfWidth * Math.sin(localTheta), 2),
  );
}
```

---

## 6. Utilities to Reuse

| Utility | Source | Purpose |
|---|---|---|
| `computeOBB(ring)` | `src/visualization/mesh/util/obb.ts` | OBB center for translation, half-extents for eccentricity check and fallback |
| `ConeGeometry` | Three.js built-in | Geometric primitive for Case A |
| `PyramidalRoofStrategy` | `./PyramidalRoofStrategy` | Delegate for Case B (irregular footprint) |
| `polygonExtentAtAngle` | `./roofGeometryUtils.ts` (new/extracted) | Polygon boundary distance per angle |

No new Three.js primitives are required beyond `ConeGeometry`.

---

## 7. Edge Cases

| Case | Behaviour |
|---|---|
| Perfect circle (regular polygon with many vertices) | `polygonExtentAtAngle` returns near-constant `r`; cone is smooth and correct |
| Square footprint (eccentricity < 1.2 if square) | Per-vertex fitting produces a pyramid shape — visually correct and consistent with Pyramidal strategy |
| Very elongated ellipse (eccentricity >= 1.2) | Delegates to `PyramidalRoofStrategy`; avoids distorted cone |
| Concave polygon | Ray may miss all edges; fallback to OBB half-extent keeps geometry valid |
| Apex vertex (`sinTheta < 0.001`) | Positioned directly at `(center.x, roofHeight, -center.y)`; no division by zero |
| `roofHeight = 0` | All vertices collapse to Y=0; geometry is degenerate but not an error (caller responsibility) |
| Ring with < 3 points | `computeOBB` and `polygonExtentAtAngle` will fail or return garbage; validate upstream in `MeshObjectManager` before calling strategy |

---

## 8. OSM / Overture Tags

| Tag | Value | Notes |
|---|---|---|
| `roof:shape` | `cone` | Primary dispatch tag |
| `roof:height` | numeric (metres) | Maps to `params.roofHeight` |

Common real-world occurrences: medieval castle towers, water towers, turret annexes, round silos, lighthouses. Nearly always paired with a cylindrical or near-circular wall footprint — the Case A path will fire in the vast majority of real data.

---

## 9. Relationship to PyramidalRoofStrategy

Geometrically, a cone and a pyramid over the same arbitrary polygon are the same structure: a triangle fan from each base edge to a single apex. The only distinction is that "cone" implies a circular or smoothed base — i.e., many short base edges approximating a circle.

In practice this means:

- **For cylindrical towers** (the intended use case): the `ConeGeometry`-based path (Case A) is superior. It uses 64 radial segments, which makes the silhouette smooth, and `polygonExtentAtAngle` maps each segment correctly to the actual wall outline.
- **For irregular footprints** (rare, possibly mislabelled OSM data): the pyramidal path (Case B) is correct and avoids duplicating the triangle-fan logic.
- **There is no semantic difference in the output geometry** for Case B — the visual result is indistinguishable from `PyramidalRoofStrategy`. This is intentional and correct.

The delegation pattern keeps `ConeRoofStrategy` focused on the circular-tower use case without reimplementing the general polygon-apex tessellation.

---

## 10. Implementation Checklist

- [ ] Extract `polygonExtentAtAngle` into `src/visualization/mesh/roofs/roofGeometryUtils.ts` (or verify it already exists there from Dome/Onion work).
- [ ] Rewrite `ConeRoofStrategy.create()` per the sketch in Section 4.
- [ ] Import `PyramidalRoofStrategy` — ensure no circular dependency (both are leaf strategies, no issue).
- [ ] Increase radial segments from 16 to 64 in `ConeGeometry` call.
- [ ] Unit test: circular ring (8-gon approximating circle) → apex at `(0, roofHeight, 0)`, base vertices close to ring boundary.
- [ ] Unit test: elongated ring (eccentricity > 1.2) → output equals `PyramidalRoofStrategy` output for same params.
- [ ] Smoke test: load a known tower in the simulator (e.g., a castle turret tile) and visually verify cone fit.
