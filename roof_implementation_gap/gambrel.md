# Gambrel Roof Strategy — Implementation Plan

## 1. Shape Description

A gambrel roof is a barn-style roof with **two slope zones on each side** of the ridge. Each side has:

- A **lower steep section** rising from the base eave to a "break" line (the purlin).
- An **upper shallower section** rising from the break line to the central ridge.

The ridge runs the full length of the building at the apex. In cross-section the profile is a **pentagon** — flat ridge at top, two upper slopes, two lower slopes — rather than the triangle of a simple gabled roof. The gable ends are also pentagonal.

Gambrel roofs are common on barns and Dutch colonial houses.

**Key parameters** (derived from `roofHeight` and OBB geometry):

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `breakHeight` (`bH`) | `roofHeight * 0.5` | Y-height of the slope-change line |
| `breakWidth` (`bW`) | `obb.halfWidth * 0.6` | Across-ridge half-distance at the break |

OSM/Overture tags: `roof:shape=gambrel`, `roof:height`.

---

## 2. Current State

**Not implemented.** The shape key `'gambrel'` is referenced in the `PITCHED_SHAPES` set (or equivalent registry) but no strategy class exists. Attempting to create a gambrel roof currently falls through to a default/flat geometry or throws.

---

## 3. Algorithm

### 3.1 Coordinate conventions

Following the project convention:
- Input: `outerRing` in local Mercator XY (meters, centroid-relative).
- Output geometry: `X = mercX`, `Y = height`, `Z = -mercY`.
- Base plane: `Y = 0`. Ridge apex: `Y = roofHeight`.

### 3.2 Named vertices (10 total)

Compute the OBB of `outerRing`. Let:

```
cos = Math.cos(ridgeAngle)
sin = Math.sin(ridgeAngle)
cx  = obb.center[0]          // Mercator X of OBB center
cz  = -obb.center[1]         // Three.js Z (negated Mercator Y)
hL  = obb.halfLength          // half-extent along ridge axis
hW  = obb.halfWidth           // half-extent across ridge axis
h   = roofHeight
bH  = h  * BREAK_HEIGHT_FRACTION   // = h  * 0.5
bW  = hW * BREAK_WIDTH_FRACTION    // = hW * 0.6
```

Along-direction in XZ: `(cos, -sin)`.
Across-direction in XZ: `(-sin, -cos)` (rightward when facing +along).

**4 base corners (Y = 0):**
```
C0 = (cx + hL*cos - hW*sin,  0,  cz - hL*sin - hW*cos)   // +along, +across
C1 = (cx + hL*cos + hW*sin,  0,  cz - hL*sin + hW*cos)   // +along, -across
C2 = (cx - hL*cos + hW*sin,  0,  cz + hL*sin + hW*cos)   // -along, -across
C3 = (cx - hL*cos - hW*sin,  0,  cz + hL*sin - hW*cos)   // -along, +across
```

**4 knee (break) points (Y = bH):**
```
K0 = (cx + hL*cos - bW*sin,  bH,  cz - hL*sin - bW*cos)  // +along, +break
K1 = (cx + hL*cos + bW*sin,  bH,  cz - hL*sin + bW*cos)  // +along, -break
K2 = (cx - hL*cos + bW*sin,  bH,  cz + hL*sin + bW*cos)  // -along, -break
K3 = (cx - hL*cos - bW*sin,  bH,  cz + hL*sin - bW*cos)  // -along, +break
```

**2 ridge endpoints (Y = h):**
```
R0 = (cx + hL*cos,  h,  cz - hL*sin)   // +along end of ridge
R1 = (cx - hL*cos,  h,  cz + hL*sin)   // -along end of ridge
```

### 3.3 Faces

8 rectangular faces (quads) + 2 pentagonal gable ends.

Each quad is split into **2 triangles** (CCW winding as seen from outside = outward normals via `computeVertexNormals()`).

Quad winding rule used throughout: split quad `(A, B, C, D)` (CCW from outside) into triangles `(A, B, C)` and `(A, C, D)`.

#### Slope faces (4 quads = 8 triangles)

**Lower slope, +across side** (steep, faces outward away from +across):
```
Quad: C3, C0, K0, K3   (CCW from +across exterior)
  Tri 1: C3, C0, K0
  Tri 2: C3, K0, K3
```

**Lower slope, -across side** (steep, faces outward away from -across):
```
Quad: C1, C2, K2, K1   (CCW from -across exterior)
  Tri 1: C1, C2, K2
  Tri 2: C1, K2, K1
```

**Upper slope, +across side** (shallower, faces outward away from +across):
```
Quad: K3, K0, R0, R1   (CCW from +across exterior)
  Tri 1: K3, K0, R0
  Tri 2: K3, R0, R1
```

**Upper slope, -across side** (shallower, faces outward away from -across):
```
Quad: K1, K2, R1, R0   (CCW from -across exterior)
  Tri 1: K1, K2, R1
  Tri 2: K1, R1, R0
```

#### Gable ends (2 pentagons = 6 triangles)

Each pentagon has 5 vertices and is split into 3 triangles via fan triangulation from the first vertex.

**Gable end +along** (CCW from +along exterior):
```
Vertices in order: C0, K0, R0, K1, C1
  Tri 1: C0, K0, R0
  Tri 2: C0, R0, K1
  Tri 3: C0, K1, C1
```

**Gable end -along** (CCW from -along exterior):
```
Vertices in order: C2, K2, R1, K3, C3
  Tri 1: C2, K2, R1
  Tri 2: C2, R1, K3
  Tri 3: C2, K3, C3
```

### 3.4 Triangle and array size

| Section | Quads | Triangles |
|---------|-------|-----------|
| Lower slopes (×2) | 2 | 4 |
| Upper slopes (×2) | 2 | 4 |
| Gable ends (×2, 3 tri each) | — | 6 |
| **Total** | | **14 triangles** |

Non-indexed geometry: `14 triangles × 3 vertices × 3 floats = **126 floats**`.

```typescript
const positions = new Float32Array(126);
```

---

## 4. TypeScript Sketch

```typescript
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { computeOBB } from '../utils/computeOBB';
import { IRoofGeometryStrategy, RoofParams } from '../IRoofGeometryStrategy';

export class GambrelRoofStrategy implements IRoofGeometryStrategy {
  private readonly BREAK_HEIGHT_FRACTION = 0.5;
  private readonly BREAK_WIDTH_FRACTION = 0.6;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h  = params.roofHeight;
    const bH = h  * this.BREAK_HEIGHT_FRACTION;
    const bW = Math.min(obb.halfWidth * this.BREAK_WIDTH_FRACTION, obb.halfWidth - 0.01); // clamped

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx  = obb.center[0];
    const cz  = -obb.center[1];
    const hL  = obb.halfLength;
    const hW  = obb.halfWidth;

    // 10 named vertices [x, y, z]
    const C0 = [cx + hL*cos - hW*sin, 0,  cz - hL*sin - hW*cos];
    const C1 = [cx + hL*cos + hW*sin, 0,  cz - hL*sin + hW*cos];
    const C2 = [cx - hL*cos + hW*sin, 0,  cz + hL*sin + hW*cos];
    const C3 = [cx - hL*cos - hW*sin, 0,  cz + hL*sin - hW*cos];
    const K0 = [cx + hL*cos - bW*sin, bH, cz - hL*sin - bW*cos];
    const K1 = [cx + hL*cos + bW*sin, bH, cz - hL*sin + bW*cos];
    const K2 = [cx - hL*cos + bW*sin, bH, cz + hL*sin + bW*cos];
    const K3 = [cx - hL*cos - bW*sin, bH, cz + hL*sin - bW*cos];
    const R0 = [cx + hL*cos, h, cz - hL*sin];
    const R1 = [cx - hL*cos, h, cz + hL*sin];

    // 14 triangles × 3 vertices × 3 floats = 126
    const positions = new Float32Array(126);
    let o = 0;

    const pushTri = (
      a: number[], b: number[], c: number[]
    ): void => {
      positions[o++] = a[0]; positions[o++] = a[1]; positions[o++] = a[2];
      positions[o++] = b[0]; positions[o++] = b[1]; positions[o++] = b[2];
      positions[o++] = c[0]; positions[o++] = c[1]; positions[o++] = c[2];
    };

    // Lower slope +across: quad C3,C0,K0,K3
    pushTri(C3, C0, K0);
    pushTri(C3, K0, K3);

    // Lower slope -across: quad C1,C2,K2,K1
    pushTri(C1, C2, K2);
    pushTri(C1, K2, K1);

    // Upper slope +across: quad K3,K0,R0,R1
    pushTri(K3, K0, R0);
    pushTri(K3, R0, R1);

    // Upper slope -across: quad K1,K2,R1,R0
    pushTri(K1, K2, R1);
    pushTri(K1, R1, R0);

    // Gable +along pentagon: C0,K0,R0,K1,C1
    pushTri(C0, K0, R0);
    pushTri(C0, R0, K1);
    pushTri(C0, K1, C1);

    // Gable -along pentagon: C2,K2,R1,K3,C3
    pushTri(C2, K2, R1);
    pushTri(C2, R1, K3);
    pushTri(C2, K3, C3);

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
```

---

## 5. Utilities to Reuse

| Utility | Usage |
|---------|-------|
| `computeOBB(ring)` | Derives `center`, `halfLength`, `halfWidth` from `outerRing` |
| `resolveRidgeAngle(params)` | Normalises `ridgeAngle` if absent or in degrees — use before passing to `Math.cos/sin` |
| `getOBBCorners(obb, ridgeAngle)` | Returns the 4 base corners C0–C3 directly; can replace the manual corner computation above if the return format matches |

The manual vertex computation in section 3.2 is self-contained and does not depend on `getOBBCorners`, but if that utility already returns `[x, z]` pairs in the same axis convention, prefer it for the base corners and compute K0–K3 / R0–R1 by substituting `bW` and `h` respectively.

---

## 6. Edge Cases

| Condition | Behaviour | Mitigation |
|-----------|-----------|------------|
| Very narrow building (`bW >= hW`) | Knee points project beyond or overlap base corners → geometry inverts | Clamp: `bW = Math.min(hW * BREAK_WIDTH_FRACTION, hW - 0.01)` |
| Square footprint (`hL ≈ hW`) | Symmetric gambrel on all four sides — visually odd but geometrically valid | No action needed; ridge angle determines orientation |
| `breakHeight = 0` | Knee points collapse to base plane; upper slopes become the whole roof — equivalent to a gabled roof | Acceptable degenerate case; no special handling required |
| `roofHeight = 0` | All vertices collapse to Y=0; degenerate flat geometry | Guard upstream; `roofHeight` should be validated before strategy dispatch |
| Non-rectangular footprint | OBB approximation is used — complex polygonal footprints (L-shapes, courtyards) receive a rectangular gambrel fit to their bounding box | Document as known limitation; acceptable trade-off for this shape |

---

## 7. OSM / Overture Tags

| Tag | Value | Maps to |
|-----|-------|---------|
| `roof:shape` | `gambrel` | Strategy key `'gambrel'` |
| `roof:height` | numeric (metres) | `params.roofHeight` |
| `roof:direction` | bearing degrees | Feeds `ridgeAngle` after conversion |

No additional gambrel-specific tags are defined in OSM. `breakHeight` and `breakWidth` are derived internally from `roofHeight` and OBB geometry using the fixed fractions.

---

## 8. Registration

In `RoofGeometryFactory.ts`, add the entry alongside existing pitched strategies:

```typescript
import { GambrelRoofStrategy } from './strategies/GambrelRoofStrategy';

// Inside the factory map / switch / registry:
registry.set('gambrel', new GambrelRoofStrategy());
```

Also ensure `'gambrel'` is present in the `PITCHED_SHAPES` set (or equivalent guard that routes to the OBB-based pipeline rather than a flat fallback):

```typescript
const PITCHED_SHAPES = new Set([
  'gabled', 'hipped', 'half-hipped', 'gambrel', /* ... */
]);
```

---

## 9. Normal Winding

Non-indexed geometry with `computeVertexNormals()` derives face normals from the cross product of the two edge vectors of each triangle. For a triangle `(A, B, C)`, the normal direction is `(B-A) × (C-A)`.

**Rule**: vertices must appear **counter-clockwise** as seen from the outside of the roof for the computed normal to point outward.

Verification per face:

- **Lower slope +across** (`C3→C0→K0`): viewed from the +across exterior, C3 is at -along/base, C0 is at +along/base, K0 is at +along/knee. CCW from outside. Correct.
- **Upper slope +across** (`K3→K0→R0`): viewed from +across exterior, K3 is -along/knee, K0 is +along/knee, R0 is +along/ridge. CCW. Correct.
- **Lower slope -across** (`C1→C2→K2`): viewed from the -across exterior, C1 is +along/base, C2 is -along/base, K2 is -along/knee. CCW from outside. Correct.
- **Gable +along** (`C0→K0→R0`, fan): viewed from +along exterior, the pentagon goes clockwise base→knee→ridge→knee→base when listed C0,K0,R0,K1,C1. Fan triangulation from C0 produces CCW triangles from that viewpoint. Correct.

If, after implementing, normals appear inverted on any face (visible as dark or inside-out in Three.js with `side: FrontSide`), reverse the two non-pivot vertices of that triangle.
