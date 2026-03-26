# Sawtooth Roof — Implementation Plan

## 1. Shape Description

A **sawtooth roof** (`roof:shape=sawtooth`) consists of N parallel skillion (shed) bays repeated across the building width. When viewed from the gable end, the cross-section profile resembles saw teeth: each tooth is one skillion slope rising from a low eave to a high eave, followed by an abrupt vertical drop back down to the low eave of the next bay.

Key properties:
- All slopes face the same direction (the high side of every bay is on the same side). This provides uniform daylighting or drainage.
- The vertical faces between bays traditionally contain clerestory windows — they face the direction opposite the slope (toward the low side of the next bay).
- The ridge runs along the building's longest axis (along-ridge direction). The teeth repeat across the building width (across-ridge direction).
- Common on industrial buildings, factories, textile mills, workshops.

Key parameters:
- `N` — number of bays (teeth). Derived as `max(MIN_BAYS, floor((2 * halfWidth) / BAY_WIDTH_METERS))`, clamped to `MAX_BAYS`. Default target bay width: 5 m.
- `ridgeAngle` — angle of the ridge in local Mercator XY (radians CCW from +X). Resolved from `roof:direction` or OBB longest axis.
- `roofHeight` (`h`) — vertical rise from low eave to high eave of each tooth.
- Bay width: `bayWidth = (2 * halfWidth) / N`.

OSM/Overture tags:

| Tag | Effect |
|-----|--------|
| `roof:shape=sawtooth` | Selects this strategy |
| `roof:height` | Sets `roofHeight` in metres |
| `roof:direction` | Compass degrees → ridge angle; controls which direction the slopes face |

---

## 2. Current State

**Not implemented.** No `SawtoothRoofStrategy` class exists. `RoofGeometryFactory` has no `'sawtooth'` entry. The shape falls through to `null` at creation time, leaving the building with no roof geometry.

---

## 3. Algorithm

### 3.1 Coordinate Frame

From `ridgeAngle` (angle of the ridge in local Mercator XY, radians CCW from +X), define the axis directions in **Three.js space** (X = mercX, Y = height, Z = −mercY):

```
// Along-ridge direction in Three.js XZ plane:
alongThreeX =  cos(ridgeAngle)
alongThreeZ = -sin(ridgeAngle)

// Across-ridge direction in Three.js XZ plane (90° CW from along in Three.js):
acrossThreeX = -sin(ridgeAngle)
acrossThreeZ = -cos(ridgeAngle)
```

These match `getOBBCorners` exactly (see `roofGeometryUtils.ts` lines 102–105).

OBB center in Three.js:
```
cx = obb.center[0]   // mercX
cz = -obb.center[1]  // -mercY
```

### 3.2 Bay Layout

The OBB's `halfWidth` is the half-extent in the across-ridge direction, and `halfLength` is the half-extent along the ridge.

```
N        = clamp(floor((2 * hW) / BAY_WIDTH_METERS), MIN_BAYS, MAX_BAYS)
bayWidth = (2 * hW) / N

// Across-ridge position of bay i boundaries (in OBB-local "across" scalar):
a_low(i)  = -hW + i       * bayWidth   // low edge of bay i  (Y = 0)
a_high(i) = -hW + (i + 1) * bayWidth   // high edge of bay i (Y = h)
```

The `+across` direction is the "uphill" direction per tooth. Each bay rises from `a_low` (at Y=0) to `a_high` (at Y=h). The vertical face at `a_high` drops from Y=h back down to Y=0, forming the tooth transition into bay i+1 whose `a_low(i+1) = a_high(i)`.

### 3.3 Vertex Construction

For any across-ridge scalar `a` and along-ridge scalar `l`, the Three.js point is:

```
X = cx + a * acrossThreeX + l * alongThreeX
Y = height
Z = cz + a * acrossThreeZ + l * alongThreeZ
```

For each bay `i`, define the four slope corners:

```
// PLL: low-across, -halfLength end, Y=0
PLL = (cx + a0*acrossThreeX + (-hL)*alongThreeX,  0,  cz + a0*acrossThreeZ + (-hL)*alongThreeZ)

// PLH: low-across, +halfLength end, Y=0
PLH = (cx + a0*acrossThreeX + (+hL)*alongThreeX,  0,  cz + a0*acrossThreeZ + (+hL)*alongThreeZ)

// PHL: high-across, -halfLength end, Y=h
PHL = (cx + a1*acrossThreeX + (-hL)*alongThreeX,  h,  cz + a1*acrossThreeZ + (-hL)*alongThreeZ)

// PHH: high-across, +halfLength end, Y=h
PHH = (cx + a1*acrossThreeX + (+hL)*alongThreeX,  h,  cz + a1*acrossThreeZ + (+hL)*alongThreeZ)

where a0 = a_low(i), a1 = a_high(i)
```

For the vertical face at `a1`, the two base-level corners are:

```
// VLL: high-across position, -halfLength end, Y=0  (same XZ as PHL but Y=0)
VLL = (cx + a1*acrossThreeX + (-hL)*alongThreeX,  0,  cz + a1*acrossThreeZ + (-hL)*alongThreeZ)

// VLH: high-across position, +halfLength end, Y=0  (same XZ as PHH but Y=0)
VLH = (cx + a1*acrossThreeX + (+hL)*alongThreeX,  0,  cz + a1*acrossThreeZ + (+hL)*alongThreeZ)
```

### 3.4 Face Normals and Winding

Three.js uses a **right-hand rule**: for a triangle (V0, V1, V2) the outward normal is `(V1−V0) × (V2−V0)`.

The coordinate mapping `Z = -mercY` flips the handedness of the XZ plane relative to the Mercator XY plane.

**Slope face** (rising from low at Y=0 to high at Y=h, across the +across direction):

The slope face has two outward-facing surfaces: upward-and-backward (the rain-shedding surface). The normal points in the direction: `−across + up`, i.e. away from the sky toward the +across side and upward.

Verify with cross product for the first triangle `(PLL, PHL, PLH)`:
```
V1 − V0 = PHL − PLL = (a1−a0)*across + h*up       (across+up direction)
V2 − V0 = PLH − PLL = (2*hL)*along                (along direction)
normal = (across+up) × along
       = across×along + up×along
```

In Three.js with X=east, Y=up, Z=south and the given axis directions, `across×along` points upward, `up×along` points toward −across. The resulting normal has a positive Y component (upward-facing) and a −across component — correct for the top surface of the slope.

Correct winding for slope quad (outward normal pointing up and toward −across):
```
Triangle 1: PLL, PHL, PLH   (counter-clockwise when viewed from above/outside)
Triangle 2: PLH, PHL, PHH
```

**Vertical face** (at `a1`, dropping from Y=h to Y=0, running the full length):

The vertical face separates the high edge of bay i from the low edge of bay i+1. It faces the **+across direction** (outward toward the next bay's low side, i.e. back toward where the roof rises again). A viewer standing on the +across side of bay i looks into this face.

Verify with cross product for triangle `(PHL, PHH, VLL)`:
```
V1 − V0 = PHH − PHL = (2*hL)*along
V2 − V0 = VLL − PHL = −h*up
normal = along × (−up) = −(along×up)
```

`along×up` in Three.js coordinates: with `along = (cos, 0, −sin)` and `up = (0,1,0)`:
```
along × up = (0*0 − (−sin)*1,  (−sin)*0 − cos*0,  cos*1 − 0*0)
           = (sin, 0, cos)
```
So `−(along×up) = (−sin, 0, −cos) = acrossThree` — the +across direction. Correct: the normal points outward toward +across.

Correct winding for vertical face quad (outward normal toward +across):
```
Triangle 1: PHL, PHH, VLL
Triangle 2: VLL, PHH, VLH
```

**End face at −halfLength** (gable end, per bay):

Each bay contributes a right triangle at the −halfLength end. The three vertices in order:
```
A = PLL  (a0, −hL, Y=0)
B = PHL  (a1, −hL, Y=h)
C = VLL  (a1, −hL, Y=0)
```
The outward normal at the −halfLength end points in the **−along** direction.

Verify: `(B−A) × (C−A) = [(a1−a0)*across + h*up] × [(a1−a0)*across]`
The component `h*up × (a1−a0)*across = h*(a1−a0)*(up×across)`.
`up × across = (0,1,0) × (−sin, 0, −cos) = (1*(−cos)−0*0, 0*(−sin)−0*(−cos), 0*0−1*(−sin)) = (−cos, 0, sin)`.
This is `−along` direction. Correct — the normal points outward at the −along end.

Winding for −halfLength end triangle (outward normal toward −along):
```
Triangle: PLL, PHL, VLL
```

**End face at +halfLength** (gable end, per bay):

Vertices:
```
A = PLH  (a0, +hL, Y=0)
B = VLH  (a1, +hL, Y=0)
C = PHH  (a1, +hL, Y=h)
```
Outward normal must point toward +along direction.

Winding for +halfLength end triangle (outward normal toward +along):
```
Triangle: PLH, VLH, PHH
```

### 3.5 Triangle Count

Per bay:
- Slope face: 2 triangles
- Vertical face: 2 triangles
- End face at −halfLength: 1 triangle
- End face at +halfLength: 1 triangle

Total: **6 triangles per bay**, **6N triangles** total.

Buffer size: `6 * N * 3 * 3` floats (6 tris × 3 vertices × 3 floats per vertex).

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from '../roofGeometryUtils';

export class SawtoothRoofStrategy implements IRoofGeometryStrategy {
  private readonly BAY_WIDTH_METERS = 5;
  private readonly MIN_BAYS = 2;
  private readonly MAX_BAYS = 20;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const hL = obb.halfLength;
    const hW = obb.halfWidth;

    const N = Math.min(
      this.MAX_BAYS,
      Math.max(this.MIN_BAYS, Math.floor((hW * 2) / this.BAY_WIDTH_METERS))
    );
    const bayWidth = (hW * 2) / N;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);

    // Along-ridge and across-ridge directions in Three.js XZ (X=mercX, Z=-mercY)
    const aLX = cos;          // alongThreeX
    const aLZ = -sin;         // alongThreeZ
    const aCX = -sin;         // acrossThreeX
    const aCZ = -cos;         // acrossThreeZ

    const cx = obb.center[0];
    const cz = -obb.center[1];

    // 6 triangles per bay × 3 vertices × 3 floats
    const positions = new Float32Array(6 * N * 3 * 3);
    let o = 0;

    const emitVertex = (x: number, y: number, z: number) => {
      positions[o++] = x;
      positions[o++] = y;
      positions[o++] = z;
    };

    const emitTri = (
      v0: [number, number, number],
      v1: [number, number, number],
      v2: [number, number, number]
    ) => {
      emitVertex(...v0);
      emitVertex(...v1);
      emitVertex(...v2);
    };

    for (let i = 0; i < N; i++) {
      const a0 = -hW + i * bayWidth;       // across scalar at low edge (Y=0)
      const a1 = -hW + (i + 1) * bayWidth; // across scalar at high edge (Y=h)

      // Slope corners
      const PLL: [number, number, number] = [cx + a0*aCX + (-hL)*aLX,  0,  cz + a0*aCZ + (-hL)*aLZ];
      const PLH: [number, number, number] = [cx + a0*aCX + (+hL)*aLX,  0,  cz + a0*aCZ + (+hL)*aLZ];
      const PHL: [number, number, number] = [cx + a1*aCX + (-hL)*aLX,  h,  cz + a1*aCZ + (-hL)*aLZ];
      const PHH: [number, number, number] = [cx + a1*aCX + (+hL)*aLX,  h,  cz + a1*aCZ + (+hL)*aLZ];

      // Vertical face base corners (same XZ as PHL/PHH, Y=0)
      const VLL: [number, number, number] = [PHL[0],  0,  PHL[2]];
      const VLH: [number, number, number] = [PHH[0],  0,  PHH[2]];

      // --- Slope face (normal: upward + toward -across) ---
      emitTri(PLL, PHL, PLH);
      emitTri(PLH, PHL, PHH);

      // --- Vertical face (normal: toward +across) ---
      emitTri(PHL, PHH, VLL);
      emitTri(VLL, PHH, VLH);

      // --- End face at -halfLength (normal: toward -along) ---
      emitTri(PLL, PHL, VLL);

      // --- End face at +halfLength (normal: toward +along) ---
      emitTri(PLH, VLH, PHH);
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

### Winding Summary

| Face | Triangle vertices (in order) | Outward normal direction |
|------|------------------------------|--------------------------|
| Slope tri 1 | PLL, PHL, PLH | Up + toward −across (rain surface) |
| Slope tri 2 | PLH, PHL, PHH | Up + toward −across (rain surface) |
| Vertical tri 1 | PHL, PHH, VLL | +across (toward next bay's low side) |
| Vertical tri 2 | VLL, PHH, VLH | +across (toward next bay's low side) |
| End −hL tri | PLL, PHL, VLL | −along |
| End +hL tri | PLH, VLH, PHH | +along |

---

## 5. Utilities to Reuse

| Utility | Source | Purpose |
|---------|--------|---------|
| `computeOBB(ring)` | `roofGeometryUtils.ts` | Derive `halfWidth`, `halfLength`, `center`, `angle` |
| `resolveRidgeAngle(obbAngle, roofDirection?, roofOrientation?)` | `roofGeometryUtils.ts` | Resolve `ridgeAngle` from OSM tags before `create()` is called. Called by the factory/caller, not inside the strategy. |

`getOBBCorners` is **not needed** — the sawtooth computes all vertices directly from OBB scalars using the axis decomposition above, which is more straightforward than the 4-corner corner set.

---

## 6. Fitting to Arbitrary Footprints

The OBB approach above produces a rectangular sawtooth that matches the OBB of the footprint, not the actual polygon outline. For rectangular industrial buildings this is typically adequate.

For non-rectangular footprints (L-shaped warehouses, T-shaped mills), a per-vertex height approach provides an exact fit:

### Per-vertex extension

1. **Compute the sawtooth height function** as a scalar function of the across-projection value `a`:
   ```
   sawtoothHeight(a):
     t = (a - (-hW)) mod bayWidth  // position within current bay, in [0, bayWidth)
     return h * (t / bayWidth)     // linear rise from 0 to h within each bay
   ```

2. **Assign per-vertex heights**: for each vertex `ring[i]`:
   ```
   acrossProj = ring[i][0] * acrossX + ring[i][1] * acrossY
               // using Mercator across direction: acrossX=-sin, acrossY=cos
   heights[i] = sawtoothHeight(acrossProj)
   ```

3. **Triangulate the top surface** with `ShapeUtils.triangulateShape(contour, [])` using the 2D footprint ring as the contour. Each resulting triangle inherits per-vertex heights.

4. **Emit side walls**: for each footprint edge `(i, j)`, emit a quad between `(Y=0, Y=0, Y=heights[j], Y=heights[i])` with winding corrected by `isCCW` (shoelace), exactly as in `SkillionRoofStrategy`.

5. Three.js mapping: `X = ring[i][0]`, `Y = heights[i]`, `Z = -ring[i][1]`.

This extension correctly handles concave and non-rectangular footprints. The internal vertical faces between bays are implicit in the per-vertex top surface and become visible through the height discontinuity across bay boundaries — though for a truly watertight mesh, explicit vertical face generation between bay-boundary edges would be needed. For visualization purposes, the `computeVertexNormals()` call handles shading discontinuities adequately.

---

## 7. Edge Cases

### N = 1 (very narrow building)

If `floor((2 * hW) / BAY_WIDTH_METERS) < MIN_BAYS` and `MIN_BAYS = 2`, the algorithm always produces at least 2 bays. However, if the caller explicitly needs N=1 behavior (single skillion), consider delegating:

```typescript
if (hW * 2 < BAY_WIDTH_METERS) {
  return new SkillionRoofStrategy().create(params);
}
```

This avoids an overly-wide single tooth.

### Very wide building (many bays)

Clamped to `MAX_BAYS = 20`. Beyond 20 teeth the visual distinction is imperceptible and triangle count would become wasteful. At 20 bays the geometry is `6 * 20 * 9 = 1080` floats — negligible.

### `roofHeight = 0`

All Y values are 0. Slope and vertical faces collapse to lines. `computeVertexNormals()` produces zero normals for degenerate triangles — the geometry is invalid but will not crash. Guard upstream: if `roofHeight <= 0`, return a flat cap or null.

### `roof:direction` tag

`roof:direction` (compass degrees, 0=North, CW) controls which direction the slopes face — i.e. the compass bearing of the high end of each tooth. This maps to `ridgeAngle` via `resolveRidgeAngle`:

```typescript
ridgeAngle = Math.PI / 2 - (roofDirection * Math.PI / 180)
```

The `+across` direction (which is the "uphill" direction for every tooth) then aligns with the given compass bearing. No extra logic is needed inside the strategy beyond receiving the resolved `ridgeAngle` in `params`.

### Square building (halfWidth ≈ halfLength)

OBB primary axis detection uses the longest edge. If the building is square, the primary axis (and thus `ridgeAngle`) may be unstable between the two orientations. This is an inherited limitation of `computeOBB`. The sawtooth will still render correctly; only the orientation may be unexpected. Consider documenting that `roof:direction` should be set explicitly on square-footprint sawtooth buildings.

### `halfWidth < 1e-6` (degenerate thin line)

`bayWidth = 0`. Division by zero risk. Guard:

```typescript
if (hW < 1e-3) {
  // degenerate: return empty geometry
  return new BufferGeometry();
}
```

---

## 8. OSM / Overture Tags

| Tag | Type | Meaning |
|-----|------|---------|
| `roof:shape=sawtooth` | string | Selects `SawtoothRoofStrategy` |
| `roof:height` | number (metres) | Vertical rise per tooth; maps to `params.roofHeight` |
| `roof:direction` | number (compass degrees, 0=North CW) | Compass bearing of the high (uphill) end of each tooth; rotates the across direction. Resolved by `resolveRidgeAngle` before `create()` is called. |

There is no OSM tag for the number of bays (`N`). It is derived from building width automatically.

---

## 9. Registration

**Step 1** — Create the file:
```
src/features/building/roofStrategies/SawtoothRoofStrategy.ts
```

**Step 2** — Add import to `RoofGeometryFactory.ts`:
```typescript
import { SawtoothRoofStrategy } from './roofStrategies/SawtoothRoofStrategy';
```

**Step 3** — Add entry to the `strategies` Map in `RoofGeometryFactory.ts`:
```typescript
['sawtooth', new SawtoothRoofStrategy()],
```

**Step 4** — Verify that the building feature parser (e.g. `buildingStrategy.ts` or `OvertureParser.ts`) passes `roofShape: 'sawtooth'` for buildings tagged `roof:shape=sawtooth`. No normalization is needed as long as shape names are lowercased before reaching the factory.
