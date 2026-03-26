# Half-Hipped Roof Strategy — Implementation Plan

## 1. Shape Description

A half-hipped roof (also called "jerkinhead" or "clipped gable") is a hybrid of gabled and hipped:

- The ridge runs the **full length** of the building, exactly like a gabled roof.
- Each gable end is **partially clipped**: instead of a triangular gable face going straight from the ridge end down to the base, the top portion is replaced by a small hip triangle.
- Below the clip point the gable remains vertical (like gabled). Above the clip point a hip triangle slopes from the ridge end down to the top edges of the gable.

The result is 8 faces total:
- 2 long trapezoidal slopes (one on each side of the ridge) — each is a hexagonal outline split into 4 triangles because the gable end rises partway up
- 2 hip triangles at the ends (small sloped triangles connecting the ridge endpoint to the two raised gable-end corners)
- 2 partial vertical gable faces at the ends (rectangles from base to hip height)

`hipFraction` controls how much of the gable end is clipped. At 0.3 (default), the top 30% of each gable end height is replaced by a hip triangle. The hip inset is purely vertical — the XZ positions of the hip points are identical to the base corners directly below them.

OSM equivalent: `roof:shape=half_hipped` (Overture may also encode `half-hipped`).

---

## 2. Current State

Not implemented. `RoofGeometryFactory` has no entry for `'half-hipped'` or `'half_hipped'`. No strategy class exists.

---

## 3. Algorithm

### Step 1 — OBB and ridge axis

```
obb = computeOBB(params.outerRing)
ridgeAngle = params.ridgeAngle   // already resolved by caller via resolveRidgeAngle()

cos = Math.cos(ridgeAngle)
sin = Math.sin(ridgeAngle)

// Along-ridge direction in Three.js XZ: (cos, -sin)
// Across-ridge direction in Three.js XZ: (-sin, -cos)
// (These are encoded inside getOBBCorners — do not recompute manually)
```

### Step 2 — Key scalars

```
h       = params.roofHeight
hipFraction = 0.3           // top 30% of gable end is hipped; tune as needed
hipH    = h * hipFraction   // Y height of the hip cut points

cx = obb.center[0]
cz = -obb.center[1]         // Three.js Z = -Mercator Y
hL = obb.halfLength
hW = obb.halfWidth           // unused for position but documents scale
```

### Step 3 — Vertex layout (10 vertices, indexed geometry)

Use `getOBBCorners(obb, ridgeAngle)` which returns `[C0, C1, C2, C3]` already in Three.js XZ space at `Y=0`:

```
Index  Label  Position                           Description
  0    C0     (corners[0][0],   0, corners[0][2])  base: +along, +across
  1    C1     (corners[1][0],   0, corners[1][2])  base: +along, -across
  2    C2     (corners[2][0],   0, corners[2][2])  base: -along, -across
  3    C3     (corners[3][0],   0, corners[3][2])  base: -along, +across
  4    R0     (cx + hL*cos,     h, cz + hL*(-sin)) ridge: +along end, Y=h
  5    R1     (cx - hL*cos,     h, cz - hL*(-sin)) ridge: -along end, Y=h
  6    HP0    (corners[0][0], hipH, corners[0][2]) hip point above C0
  7    HP1    (corners[1][0], hipH, corners[1][2]) hip point above C1
  8    HP2    (corners[2][0], hipH, corners[2][2]) hip point above C2
  9    HP3    (corners[3][0], hipH, corners[3][2]) hip point above C3
```

Ridge endpoints R0/R1 use the same formula as `GabledRoofStrategy` (full `halfLength`, no inset).

HP0–HP3 share the XZ of their corresponding base corner, only Y changes to `hipH`. They mark the top of the vertical gable section and the base of the hip triangle.

### Step 4 — Face list and winding

All winding is CCW when viewed from outside (outward normals). `computeVertexNormals()` handles the actual normals.

**Long slope +across** (outward normal points toward +across):
The outline is a hexagon: C3 → C0 → HP0 → R0 → R1 → HP3. Split into 4 triangles:
```
3, 0, 6    // lower tri: C3, C0, HP0
3, 6, 9    // lower tri: C3, HP0, HP3
9, 6, 4    // upper tri: HP3, HP0, R0
9, 4, 5    // upper tri: HP3, R0, R1
```

**Long slope -across** (outward normal points toward -across):
The outline is a hexagon: C1 → C2 → HP2 → R1 → R0 → HP1. Split into 4 triangles:
```
1, 2, 8    // lower tri: C1, C2, HP2
1, 8, 7    // lower tri: C1, HP2, HP1
7, 8, 5    // upper tri: HP1, HP2, R1
7, 5, 4    // upper tri: HP1, R1, R0
```

**Hip triangle +along end** (outward normal points toward +along):
```
4, 7, 6    // R0, HP1, HP0
```
Winding check: viewed from +along, HP0 is on the +across side (left), HP1 on -across (right), R0 at top. CCW from outside = R0 → HP1 → HP0.

**Hip triangle -along end** (outward normal points toward -along):
```
5, 9, 8    // R1, HP3, HP2
```
Winding check: viewed from -along, HP3 is on +across side (right from outside), HP2 on -across (left). R1 at top. CCW from outside = R1 → HP3 → HP2.

**Vertical gable face +along end** (outward normal points toward +along):
Rectangle C1 → C0 → HP0 → HP1, split into 2 triangles:
```
1, 0, 6    // C1, C0, HP0
1, 6, 7    // C1, HP0, HP1
```
Winding check: viewed from +along, C0 is +across (left), C1 is -across (right). CCW from outside = C1 → C0 → HP0 → HP1.

**Vertical gable face -along end** (outward normal points toward -along):
Rectangle C2 → C3 → HP3 → HP2, split into 2 triangles:
```
2, 3, 9    // C2, C3, HP3
2, 9, 8    // C2, HP3, HP2
```
Winding check: viewed from -along, C3 is +across (left from outside), C2 is -across (right). CCW from outside = C2 → C3 → HP3 → HP2.

**Complete index array (40 indices, 12 triangles × 3 / ... wait: 4+4+1+1+2+2 = 14 triangles × 3 = 42 indices):**

```typescript
const indices = [
  // Long slope +across (4 triangles)
  3, 0, 6,
  3, 6, 9,
  9, 6, 4,
  9, 4, 5,
  // Long slope -across (4 triangles)
  1, 2, 8,
  1, 8, 7,
  7, 8, 5,
  7, 5, 4,
  // Hip triangle +along end (1 triangle)
  4, 7, 6,
  // Hip triangle -along end (1 triangle)
  5, 9, 8,
  // Vertical gable +along end (2 triangles)
  1, 0, 6,
  1, 6, 7,
  // Vertical gable -along end (2 triangles)
  2, 3, 9,
  2, 9, 8,
];
// Total: 14 triangles × 3 = 42 indices
```

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';

export class HalfHippedRoofStrategy implements IRoofGeometryStrategy {
  private readonly HIP_FRACTION = 0.3; // top 30% of gable end is hipped

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = getOBBCorners(obb, params.ridgeAngle);
    const h = params.roofHeight;
    const hipH = h * this.HIP_FRACTION;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];
    const hL = obb.halfLength;

    // Ridge endpoints (full length, same as GabledRoofStrategy)
    const r0x = cx + hL * cos;
    const r0z = cz + hL * -sin;
    const r1x = cx - hL * cos;
    const r1z = cz - hL * -sin;

    // 10 vertices:
    // 0–3: base corners (C0, C1, C2, C3) at Y=0
    // 4–5: ridge endpoints (R0, R1) at Y=h
    // 6–9: hip points (HP0, HP1, HP2, HP3) at Y=hipH, same XZ as C0–C3
    const positions = new Float32Array([
      corners[0]![0],  0,    corners[0]![2], // 0: C0  +along +across
      corners[1]![0],  0,    corners[1]![2], // 1: C1  +along -across
      corners[2]![0],  0,    corners[2]![2], // 2: C2  -along -across
      corners[3]![0],  0,    corners[3]![2], // 3: C3  -along +across
      r0x,             h,    r0z,            // 4: R0  ridge +along end
      r1x,             h,    r1z,            // 5: R1  ridge -along end
      corners[0]![0],  hipH, corners[0]![2], // 6: HP0 above C0
      corners[1]![0],  hipH, corners[1]![2], // 7: HP1 above C1
      corners[2]![0],  hipH, corners[2]![2], // 8: HP2 above C2
      corners[3]![0],  hipH, corners[3]![2], // 9: HP3 above C3
    ]);

    const indices = [
      // Long slope +across (4 tri)
      3, 0, 6,  3, 6, 9,  9, 6, 4,  9, 4, 5,
      // Long slope -across (4 tri)
      1, 2, 8,  1, 8, 7,  7, 8, 5,  7, 5, 4,
      // Hip triangle +along end (1 tri)
      4, 7, 6,
      // Hip triangle -along end (1 tri)
      5, 9, 8,
      // Vertical gable +along end (2 tri)
      1, 0, 6,  1, 6, 7,
      // Vertical gable -along end (2 tri)
      2, 3, 9,  2, 9, 8,
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

| Utility | Source | Purpose |
|---|---|---|
| `computeOBB(ring)` | `roofGeometryUtils.ts` | Oriented bounding box from polygon ring |
| `getOBBCorners(obb, ridgeAngle)` | `roofGeometryUtils.ts` | 4 corners in Three.js XZ space |
| `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` | `roofGeometryUtils.ts` | Called by the factory/caller before passing `ridgeAngle` in params |
| `BufferGeometry`, `Float32BufferAttribute` | `three` | Geometry construction |

No new utilities needed. The pattern is identical to `GabledRoofStrategy` and `HippedRoofStrategy`.

---

## 6. Edge Cases

**`hipFraction = 0`** — `hipH = 0`, so HP0–HP3 collapse to base corners. The vertical gable faces degenerate to zero height. The hip triangles degenerate to flat base triangles. The long slopes become full trapezoids from base to ridge. Behavior approaches gabled, but degenerate zero-height faces will be computed. Guard: if `hipFraction <= 0`, delegate to `GabledRoofStrategy`.

**`hipFraction = 1`** — `hipH = h`, so HP0–HP3 coincide with ridge height. The vertical gable faces reach full height but have zero visible area (HP = ridge height, but HP is at the corners, not at the ridge XZ position). The long slopes collapse to triangles. Behavior approaches hipped (but imperfectly, since ridge still has full length). Guard: if `hipFraction >= 1`, delegate to `HippedRoofStrategy`.

**Square footprint** — OBB gives `halfLength ≈ halfWidth`. The long slopes become very short. The hip triangles and vertical gables dominate. This is visually acceptable.

**Non-rectangular footprint** — OBB is a best-fit approximation. The base corners C0–C3 are OBB corners, not the actual polygon vertices. This is the same limitation as `GabledRoofStrategy` and `HippedRoofStrategy`. For the purposes of this codebase, OBB approximation is the established and accepted pattern — document it, do not work around it.

**Very flat roof (`roofHeight` near 0)** — All Y values compress toward 0. No special handling needed; geometry is valid.

**`hipFraction` from OSM data** — OSM does not encode `hipFraction` directly. A reasonable derivation could use `roof:angle` or compute it from `roof:height` vs wall height ratio. For now, hardcode `0.3` as a visually plausible default.

---

## 7. OSM / Overture Tags

| Tag | Value | Notes |
|---|---|---|
| `roof:shape` | `half_hipped` | Primary OSM tag |
| `roof:shape` | `half-hipped` | Alternative encoding (Overture may use hyphen) |
| `roof:height` | metres | Maps directly to `params.roofHeight` |
| `roof:orientation` | `along` / `across` | Passed to `resolveRidgeAngle` |
| `roof:direction` | compass degrees | Passed to `resolveRidgeAngle`; overrides orientation |

Both key variants (`half_hipped` and `half-hipped`) should be registered in the factory.

---

## 8. Registration

### `RoofGeometryFactory.ts`

Add the import and two map entries:

```typescript
import { HalfHippedRoofStrategy } from './roofStrategies/HalfHippedRoofStrategy';

// Inside the Map constructor:
['half-hipped', new HalfHippedRoofStrategy()],
['half_hipped', new HalfHippedRoofStrategy()],
```

Both keys share **one instance** (the strategy is stateless).

### `PITCHED_SHAPES` set (if it exists)

If there is a set used to pre-filter which shapes get processed as pitched roofs, add both `'half-hipped'` and `'half_hipped'` to it.

---

## 9. Tests to Write

Mirror the pattern from `RoofGeometryFactory.test.ts`:

```typescript
describe('half-hipped', () => {
  it('creates geometry with 10 vertices', () => { ... });
  it('has ridge at roofHeight', () => { /* maxY === roofHeight */ });
  it('has base at Y=0', () => { /* minY === 0 */ });
  it('has hip points at hipH (30% of roofHeight)', () => {
    // Collect unique Y values; check that h * 0.3 is present
  });
  it('has 14 triangles (42 index values)', () => {
    expect(geom!.index!.count).toBe(42);
  });
  it('ridge vertex normals have positive Y', () => {
    // vertices 4 and 5 are ridge points
  });
  it('hip fraction 0 behaves like gabled (delegate guard)', () => { ... });
  it('hip fraction 1 behaves like hipped (delegate guard)', () => { ... });
});
```
