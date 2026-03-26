# Round Roof — Implementation Plan

## 1. Shape Description

OSM `roof:shape=round` describes a cylindrical or barrel-vault roof: a semi-cylindrical surface laid on its side along the ridge axis. The ridge is not a sharp edge but the topmost line of the cylinder.

Common on industrial buildings, aircraft hangars, Quonset huts, sports halls, and garden structures.

**Variants:**
- **Barrel vault** (most common): full semi-cylinder, arc spans from one eave to the other
- **Rounded roof**: shallower arc — between flat and a full semi-circle; controlled by `roofHeight` relative to `halfWidth`

The shape is fully parameterized by `halfWidth` (cylinder radius along the across-ridge axis) and `roofHeight` (peak height above the eave). When `roofHeight == halfWidth`, the cross-section is a true semi-circle. When `roofHeight < halfWidth`, the arc is shallower (elliptical cross-section).

---

## 2. Current State

Not implemented. `RoofGeometryFactory` has no entry for `'round'`. Documented in `docs/osm/keys/roof_shape.md` only.

---

## 3. Algorithm

### Overview

Build a half-cylinder extruded along the ridge axis, then close both ends with arc fan caps.

The cross-section in the across/height plane is a semi-ellipse:
- `across(phi) = halfWidth * cos(phi)` — spans from `-halfWidth` to `+halfWidth`
- `height(phi) = roofHeight * sin(phi)` — 0 at both eaves, `roofHeight` at the crown

where `phi` runs from `0` to `π` (N arc segments, N=24).

The extrusion axis is the ridge direction, spanning from `-halfLength` to `+halfLength`.

---

### Step 1 — Compute OBB

```typescript
const obb = computeOBB(params.outerRing);
const h   = params.roofHeight;
const hL  = obb.halfLength;   // half-extent along ridge
const hW  = obb.halfWidth;    // half-extent across ridge = cylinder radius
```

If `hW > hL`, the OBB is wider than it is long. The cylinder should run along the shorter axis so it looks like a barrel vault, not a barely-curved slab. Handle this by swapping: treat `hL_cylinder = hW`, `hW_cylinder = hL`, and rotate the ridge angle by `π/2`. See edge cases section.

---

### Step 2 — Establish Three.js direction vectors

The ridge direction in Three.js XZ (from `ridgeAngle` in Mercator radians, where angle 0 = +X east, CCW):

```
Along-ridge:  aX =  cos(ridgeAngle),  aZ = -sin(ridgeAngle)
Across-ridge: cX = -sin(ridgeAngle),  cZ = -cos(ridgeAngle)
```

This follows the same convention used by `getOBBCorners` in `roofGeometryUtils.ts`:
- Mercator `+X` maps to Three.js `+X`
- Mercator `+Y` maps to Three.js `-Z`

OBB center in Three.js:
```
cx = obb.center[0]
cz = -obb.center[1]
```

---

### Step 3 — Arc cross-section

N = 24 arc segments (25 sample points, indices 0..N inclusive).

For arc index `i` (0..N):
```
phi_i       = (i / N) * Math.PI          // 0 at phi=0 → right eave; π at left eave
arcAcross_i = hW * Math.cos(phi_i)       // -hW → 0 → +hW  (across-ridge offset)
arcHeight_i = h  * Math.sin(phi_i)       // 0 → h → 0       (Y height)
```

At `i=0`:   `arcAcross = +hW`, `arcHeight = 0` — right eave
At `i=N/2`: `arcAcross = 0`,   `arcHeight = h` — crown
At `i=N`:   `arcAcross = -hW`, `arcHeight = 0` — left eave

**Three.js vertex position** for arc index `i`, along-ridge parameter `t` (either `-1` or `+1` for the two strip ends, mapped to `t * hL`):

```
X = cx + (t * hL) * aX + arcAcross_i * cX
Y = arcHeight_i
Z = cz + (t * hL) * aZ + arcAcross_i * cZ
```

---

### Step 4 — Curved surface strip

The main surface is N quads, each formed by arc step `i → i+1` extruded from `t=-1` to `t=+1`.

Label the four corners of each quad:
```
A = vertex(phi_i,   t=-1)   // near, right
B = vertex(phi_i,   t=+1)   // far,  right
C = vertex(phi_{i+1}, t=+1) // far,  left
D = vertex(phi_{i+1}, t=-1) // near, left
```

**Winding order** (outward normals face away from the cylinder axis):

The outward normal points away from the interior of the cylinder — radially outward and upward. Three.js uses CCW front-face winding by default. Looking at each quad from outside the cylinder (from the exterior surface):

```
Triangle 1: A, B, C   (CCW when viewed from outside)
Triangle 2: A, C, D   (CCW when viewed from outside)
```

Verification: For the crown quad (`phi ~ π/2`), the outside is "up". Looking from above:
- `A` and `B` are on the right arc step (positive `cX/cZ` direction), near and far
- `C` and `D` are on the next arc step (more toward the left)
- Going A → B → C traces CCW when viewed from outside (above/right), which is correct

Alternatively expressed as indices when vertices are stored in order `[A, B, C, D]`:
```
indices: [0, 1, 2,  0, 2, 3]
```

Since the geometry is non-indexed (flat normals via `computeVertexNormals`), emit vertices directly without an index buffer — consistent with `PyramidalRoofStrategy` and `SkillionRoofStrategy`.

**Triangle count:** N strips × 2 triangles × 3 vertices × 3 floats = `N * 18` floats for the strip.

---

### Step 5 — End caps

Each end cap is a fan of N triangles centered on the arc midpoint (crown point at that end).

Cap center at `t = ±1`:
```
centerX = cx + (±hL) * aX
centerY = h * sin(π/2) = h    // But this is wrong — arc midpoint at phi=π/2 is (across=0, height=h)
centerZ = cz + (±hL) * aZ
```

Actually: the cap is a planar fan filling the semi-ellipse at each end face. The center of the fan should be the geometric centroid of the arc, or simply the arc midpoint. The simplest approach is a fan from the arc midpoint (crown, `phi=π/2`) outward to each arc edge pair.

**Better approach** — fan from arc midpoint:

For the `t=+1` end (far end):
- Fan center: `vertex(π/2, +1)` — the crown point at this end
- Fan triangles: for `i` in `0..N-1`, emit `[center, vertex(phi_{i+1}, +1), vertex(phi_i, +1)]`
  - Winding: CCW when viewed from outside (from `+along` direction, i.e., looking in the `-along` direction toward the face)
  - The normal should point in the `+along` direction (outward from the far end)

For the `t=-1` end (near end):
- Fan center: `vertex(π/2, -1)`
- Fan triangles: for `i` in `0..N-1`, emit `[center, vertex(phi_i, -1), vertex(phi_{i+1}, -1)]`
  - Reversed winding vs. far cap — the normal must point in the `-along` direction

**Cap triangle count:** 2 ends × N triangles × 3 vertices × 3 floats = `N * 18` floats for caps.

**Note on end caps vs. wall extrusion:** Wall extrusion in the building pipeline typically generates vertical walls, not curved end caps. Emitting arc caps from this strategy is correct — they fill the visual gap at the barrel ends. They do not need to match the wall geometry exactly because the wall tops are already at Y=0 (base of the roof).

---

### Step 6 — Buffer layout

```
Total triangles = N * 2 (strip) + N * 2 (caps) = N * 4
Total floats    = N * 4 * 3 * 3 = N * 36
```

For N=24: `24 * 36 = 864` floats. Small, no concern.

Pre-allocate:
```typescript
const positions = new Float32Array(N * 4 * 3 * 3);
let o = 0;

function push(x: number, y: number, z: number) {
  positions[o++] = x;
  positions[o++] = y;
  positions[o++] = z;
}
```

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

export class RoundRoofStrategy implements IRoofGeometryStrategy {
  private readonly ARC_SEGMENTS = 24;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const N = this.ARC_SEGMENTS;

    // If the OBB is wider than long, swap axes so the cylinder always runs along
    // the longer dimension (more natural barrel vault orientation).
    let hL = obb.halfLength;
    let hW = obb.halfWidth;
    let ridgeAngle = params.ridgeAngle;
    if (hW > hL) {
      [hL, hW] = [hW, hL];
      ridgeAngle += Math.PI / 2;
    }

    // Direction vectors in Three.js XZ (Mercator: X→X, Y→-Z)
    const cosA = Math.cos(ridgeAngle);
    const sinA = Math.sin(ridgeAngle);
    const aX =  cosA;  const aZ = -sinA; // along-ridge
    const cX = -sinA;  const cZ = -cosA; // across-ridge

    // OBB center in Three.js
    const cx = obb.center[0];
    const cz = -obb.center[1];

    // Precompute arc sample points
    const arcAcross = new Float64Array(N + 1); // across-ridge offset
    const arcHeight = new Float64Array(N + 1); // Y height
    for (let i = 0; i <= N; i++) {
      const phi = (i / N) * Math.PI;
      arcAcross[i] = hW * Math.cos(phi);
      arcHeight[i] = h  * Math.sin(phi);
    }

    // Helper: Three.js position for arc sample i at along-ridge parameter t (-1 or +1)
    const vx = (i: number, t: number) => cx + t * hL * aX + arcAcross[i]! * cX;
    const vy = (i: number)            => arcHeight[i]!;
    const vz = (i: number, t: number) => cz + t * hL * aZ + arcAcross[i]! * cZ;

    // Buffer: N*2 strip tris + N*2 cap tris = N*4 tris, 3 verts each, 3 floats each
    const positions = new Float32Array(N * 4 * 3 * 3);
    let o = 0;

    const push = (x: number, y: number, z: number) => {
      positions[o++] = x;
      positions[o++] = y;
      positions[o++] = z;
    };

    // --- Curved strip ---
    // For arc step i→i+1, quad corners A(i,-1) B(i,+1) C(i+1,+1) D(i+1,-1)
    // Outward-normal CCW winding (viewed from outside the cylinder):
    //   Tri 1: A, B, C
    //   Tri 2: A, C, D
    for (let i = 0; i < N; i++) {
      // Tri 1: A, B, C
      push(vx(i,   -1), vy(i),   vz(i,   -1));
      push(vx(i,   +1), vy(i),   vz(i,   +1));
      push(vx(i+1, +1), vy(i+1), vz(i+1, +1));
      // Tri 2: A, C, D
      push(vx(i,   -1), vy(i),   vz(i,   -1));
      push(vx(i+1, +1), vy(i+1), vz(i+1, +1));
      push(vx(i+1, -1), vy(i+1), vz(i+1, -1));
    }

    // --- Far end cap (t=+1), normal points in +along direction ---
    // Fan center: crown at (across=0, height=h) at t=+1 → arc index N/2 (phi=π/2)
    // Fan: [center, arc[i+1], arc[i]] — CCW viewed from +along (outside)
    const capCenterX = cx + hL * aX; // arcAcross[N/2]=0
    const capCenterY = h;
    const capCenterZ = cz + hL * aZ;
    for (let i = 0; i < N; i++) {
      push(capCenterX,    capCenterY,    capCenterZ);
      push(vx(i+1, +1), vy(i+1), vz(i+1, +1));
      push(vx(i,   +1), vy(i),   vz(i,   +1));
    }

    // --- Near end cap (t=-1), normal points in -along direction ---
    // Fan: [center, arc[i], arc[i+1]] — CCW viewed from -along (outside)
    const nearCapCenterX = cx - hL * aX;
    const nearCapCenterY = h;
    const nearCapCenterZ = cz - hL * aZ;
    for (let i = 0; i < N; i++) {
      push(nearCapCenterX, nearCapCenterY, nearCapCenterZ);
      push(vx(i,   -1), vy(i),   vz(i,   -1));
      push(vx(i+1, -1), vy(i+1), vz(i+1, -1));
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Winding Order — Detailed Justification

Three.js default: front face = CCW winding when viewed from outside (front).

**Strip quads:** The outward normal of the cylinder surface points radially away from the ridge axis. Consider the quad at the crown (`phi ~ π/2`), viewed from directly above (+Y):

- `A = vertex(phi_i,   t=-1)`: slightly right of crown, near end
- `B = vertex(phi_i,   t=+1)`: slightly right of crown, far end
- `C = vertex(phi_{i+1}, t=+1)`: slightly left of crown, far end
- `D = vertex(phi_{i+1}, t=-1)`: slightly left of crown, near end

From above (outside), going A → B → C is CCW (right-near → right-far → left-far). Tri 1 = `[A, B, C]`. Tri 2 = `[A, C, D]` continues CCW. Both give upward/outward normals. Correct.

For eave quads (`phi ~ 0` or `phi ~ π`), the outward normal points sideways (across-ridge). The same winding holds: `[A, B, C]` and `[A, C, D]` produce normals pointing away from the cylinder center.

**Far end cap** (`t=+1`): viewed from outside (looking in the `-along` direction from beyond the far end — so looking from `+along` toward the building), the fan must be CCW. The along direction is `(aX, aZ)` in XZ. Looking from `+along` inward, the across direction `(cX, cZ)` appears CCW relative to the arc. Fan order `[center, arc[i+1], arc[i]]` is CCW when the arc goes from `arcAcross = +hW` (phi=0) toward `arcAcross = -hW` (phi=π) — which is the direction of increasing `i`. So `arc[i+1]` before `arc[i]` in the fan gives CCW. Correct.

**Near end cap** (`t=-1`): viewed from outside (from `-along` direction). The view is mirrored, so CCW from the far side becomes CW from the near side, meaning we must reverse: `[center, arc[i], arc[i+1]]`. Correct.

---

## 6. Utilities to Reuse

- `computeOBB(ring)` — from `roofGeometryUtils.ts`; provides `center`, `halfLength`, `halfWidth`, `angle`
- `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` — caller resolves `params.ridgeAngle` before invoking the strategy; no change needed inside the strategy
- No need for `getOBBCorners` — the round strategy computes its own arc vertices directly

---

## 7. Fitting to the Actual Polygon

The OBB approach is appropriate for `roof:shape=round` because:

- Buildings with barrel vault roofs are almost always rectangular (hangars, industrial sheds, Quonset huts)
- The arc naturally fits the rectangular OBB: it spans `±halfWidth` across and `±halfLength` along
- The OBB center may differ slightly from the polygon centroid on non-rectangular footprints, but this is acceptable

**Non-rectangular extension (not required):** For a trapezoidal or irregular polygon, one could project polygon vertices onto the across-ridge axis, compute per-vertex `halfWidth`, and vary the arc radius along the ridge. This adds considerable complexity and is rarely needed in practice — YAGNI.

---

## 8. Edge Cases

| Case | Handling |
|------|----------|
| `hW > hL` (wider than long) | Swap `hL`/`hW`, rotate `ridgeAngle` by `π/2` so the cylinder always spans the longer dimension |
| `roofHeight == 0` | `arcHeight[i] = 0` for all `i`; degenerates to a flat surface at Y=0. No crash. Consider guarding with early return of a flat `PlaneGeometry` or let the factory caller skip. |
| `roofHeight == halfWidth` | Exact semi-circle cross-section — the common case, works normally |
| `roofHeight > halfWidth` | Taller-than-wide arc (pointed barrel vault) — valid, the ellipse just stretches vertically |
| Very small polygon | `halfLength` or `halfWidth` near 0; geometry degenerates gracefully (zero-area triangles) |
| Open vs. closed ends | End caps are always emitted. The building wall extrusion (called separately) generates the vertical walls beneath the eaves, so the arc end caps are the only visual closure at the barrel ends. If end walls are present (e.g., building part), the caps overlap harmlessly. |
| `ARC_SEGMENTS` tuning | N=24 gives smooth appearance at typical distances. Can be lowered to 16 for distant LOD if LOD is added in future. |

---

## 9. OSM / Overture Tags

| Tag | Meaning | Usage in strategy |
|-----|---------|-------------------|
| `roof:shape=round` | Cylindrical barrel vault | Strategy lookup key |
| `roof:height` | Height of roof above wall top | → `params.roofHeight` |
| `roof:orientation=across` | Arc runs across the short axis | → `resolveRidgeAngle` returns `obbAngle + π/2` |
| `roof:orientation=along` | Arc runs along the long axis (default) | → `resolveRidgeAngle` returns `obbAngle` |
| `roof:direction` | Compass bearing of ridge (degrees) | → `resolveRidgeAngle` converts to radians |

`roof:orientation` is especially relevant here: "along" means the cylinder barrel runs along the building's long axis (the ridge line is long), which is the default and most common. "across" means the cylinder runs the other way.

---

## 10. Registration

In `src/features/building/RoofGeometryFactory.ts`:

1. Import the strategy:
```typescript
import { RoundRoofStrategy } from './roofStrategies/RoundRoofStrategy';
```

2. Add to the strategies map:
```typescript
private readonly strategies = new Map<string, IRoofGeometryStrategy>([
  ['pyramidal', new PyramidalRoofStrategy()],
  ['cone',      new ConeRoofStrategy()],
  ['gabled',    new GabledRoofStrategy()],
  ['hipped',    new HippedRoofStrategy()],
  ['skillion',  new SkillionRoofStrategy()],
  ['dome',      new DomeRoofStrategy()],
  ['onion',     new OnionRoofStrategy()],
  ['round',     new RoundRoofStrategy()],   // <-- add this
]);
```

File: `src/features/building/roofStrategies/RoundRoofStrategy.ts`
