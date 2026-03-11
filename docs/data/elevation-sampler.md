# Elevation Sampling & Interpolation

## Overview

**ElevationSampler** is the component responsible for querying terrain elevation at arbitrary Mercator coordinates. It bridges the gap between discrete elevation tiles (256×256 pixel grids) and continuous 3D positioning by using **bilinear interpolation** to compute smooth elevation values.

### Purpose

When placing 3D objects (buildings, trees, structures) on the terrain surface, their positions are specified by geographic coordinates (Mercator X, Y). However, elevation data arrives as discrete grid samples at pixel resolution (~4.77 meters at zoom 15). ElevationSampler smooths between these samples to produce natural-looking terrain without visible pixelation or step discontinuities.

### Integration Point

ElevationSampler is initialized once during application startup in the initialization sequence:

```typescript
const elevationSampler = new ElevationSampler(elevationData);
meshObjectManager = new MeshObjectManager(
  viewer3D.getScene(),
  contextData,
  elevationSampler  // Passed to all mesh factories
);
```

It's then used by all mesh factories (BuildingMeshFactory, VegetationMeshFactory, StructureMeshFactory, etc.) to determine object placement heights during the animation loop's mesh creation phase.

---

## API Reference

### Constructor

```typescript
constructor(elevationData: ElevationDataManager)
```

**Parameters:**
- `elevationData`: Reference to the elevation data manager that holds loaded tiles
  - Must be initialized and actively maintaining the tile ring
  - Safe to call during async tile loading (returns 0 for unloaded tiles)

**Throws:** None. Returns 0 for invalid/missing data rather than throwing.

### Method: sampleAt()

```typescript
sampleAt(mercatorX: number, mercatorY: number): number
```

**Parameters:**
- `mercatorX` (number): X coordinate in Web Mercator projection (increases eastward)
- `mercatorY` (number): Y coordinate in Web Mercator projection (increases northward)

**Returns:** `number` - Elevation in meters above mean sea level
  - Typical range: -32,768 to +32,767 m (sufficient for Earth's topography)
  - Includes sub-meter precision via blue channel (~4 mm steps)
  - Returns `0` if no tile covers the point (tile not yet loaded)

**Characteristics:**
- **Fast**: O(1) constant time - single tile lookup + bilinear calculation
- **Safe**: Never throws; gracefully handles unloaded tiles
- **Precise**: Preserves sub-meter accuracy from Terrarium data
- **Stateless**: Can be called at any coordinate; no side effects

### Example Usage

```typescript
// Sample elevation at drone's current position
const droneElevation = elevationSampler.sampleAt(drone.location.x, drone.location.y);

// Sample at building centroid
const buildingElevation = elevationSampler.sampleAt(centroidX, centroidY);

// Use for 3D positioning
const terrainY = elevationSampler.sampleAt(mercatorX, mercatorY);
position.set(mercatorX, terrainY, -mercatorY);
```

---

## The Bilinear Interpolation Algorithm

### Why Bilinear Interpolation?

Elevation tiles contain discrete pixel values representing 4.77 m × 4.77 m ground samples at zoom level 15. When an object's position falls between pixels, we need to estimate the elevation at that exact point.

**Three approaches exist:**

1. **Nearest-neighbor**: Use the closest pixel value
   - ❌ Creates visible "steps" where ground transitions abruptly between pixels
   - ❌ Looks unnatural, especially on slopes

2. **Bilinear interpolation**: Blend 4 neighboring pixels based on distance
   - ✓ Smooth transitions between pixel values
   - ✓ Objects rest naturally on terrain surface
   - ✓ Standard approach in 3D graphics

3. **Higher-order** (cubic, spline): More complex, diminishing returns
   - ❌ Not needed; bilinear already smooth enough given pixel resolution
   - ❌ Performance cost not justified

ElevationSampler uses **bilinear interpolation**.

### How It Works: Step-by-Step

Given a Mercator coordinate `(mercatorX, mercatorY)`:

#### Step 1: Locate the covering tile

```typescript
const tile = elevationData.getTileAt(mercatorX, mercatorY);
if (!tile) return 0;  // Tile not loaded; fallback to 0
```

Each tile covers a rectangular region bounded by its Mercator bounds. If the point falls outside loaded tiles, return 0.

#### Step 2: Convert Mercator coordinate to fractional position within tile

Mercator X and Y range from 0 to ~262,144 (at zoom 15). Each tile covers a specific region. We normalize the coordinate within the tile to a fraction [0, 1]:

```typescript
const { minX, maxX, minY, maxY } = tile.mercatorBounds;
const fracX = (mercatorX - minX) / (maxX - minX);
const fracY = 1 - (mercatorY - minY) / (maxY - minY);  // Y-inverted!
```

**Critical detail: Y-inversion**

- Mercator Y increases **northward** (standard geographic convention)
- Tile rows are indexed 0→255 from **north to south** (row 0 = north edge, row 255 = south edge)
- Therefore: `fracY = 1 - normalized` converts northward coordinates to southward row indexing

**Visual example:**

```
Mercator space          Tile grid
(0 = south)      (0 = north)
   ↑ Y             [0,0] ←─ north
   │               ...
   │ north         [255,255] ← south
   └────────────

fracY in Mercator Y=minY → fracY=1 → row 0 (north) ✓
fracY in Mercator Y=maxY → fracY=0 → row 255 (south) ✓
```

#### Step 3: Map fractional position to pixel coordinates

Tiles are 256×256 pixels. Multiply fractional position by pixel count and clamp to valid range:

```typescript
const n = 256;
const px = Math.max(0, Math.min(n - 1, fracX * (n - 1)));
const py = Math.max(0, Math.min(n - 1, fracY * (n - 1)));
```

`px` and `py` are now in pixel-space with sub-pixel precision (fractional part represents within-pixel location).

#### Step 4: Extract 4 neighboring pixels

Determine the 2×2 grid of pixels surrounding the point:

```typescript
const col0 = Math.floor(px);      // left column
const col1 = Math.min(col0 + 1, n - 1);  // right column (clamped)
const row0 = Math.floor(py);      // top row
const row1 = Math.min(row0 + 1, n - 1);  // bottom row (clamped)

const v00 = tile.data[row0]![col0]!;  // top-left
const v01 = tile.data[row0]![col1]!;  // top-right
const v10 = tile.data[row1]![col0]!;  // bottom-left
const v11 = tile.data[row1]![col1]!;  // bottom-right
```

**Boundary handling**: If the point is exactly on a tile edge, `col1` or `row1` are clamped to prevent out-of-bounds access. This uses the edge pixel value for extrapolation.

#### Step 5: Compute sub-pixel fractional offsets

```typescript
const tx = px - col0;  // 0 to 1: how far from left pixel to right pixel
const ty = py - row0;  // 0 to 1: how far from top pixel to bottom pixel
```

These represent position **within** the 1×1 pixel cell.

#### Step 6: Apply bilinear interpolation formula

```typescript
return (
  (v00 * (1 - tx) + v01 * tx) * (1 - ty) +
  (v10 * (1 - tx) + v11 * tx) * ty
);
```

**Breaking down the math:**

1. **Interpolate left column**: `v00 * (1 - tx) + v01 * tx`
   - Blend between top-left and top-right values based on horizontal position (tx)

2. **Interpolate right column**: `v10 * (1 - tx) + v11 * tx`
   - Blend between bottom-left and bottom-right values based on horizontal position (tx)

3. **Interpolate between rows**: `result_left * (1 - ty) + result_right * ty`
   - Blend the two row results based on vertical position (ty)

**Weights visualization:**

```
For a point at fractional offset (tx, ty) within a pixel cell:

    (1-tx)      tx
      ↓          ↓
v00 ━━━━╳━━━━ v01    ← (1-ty) row weight
     ┃ point ┃
     ┣━━━╳━━━┫

v10 ━━━━╳━━━━ v11    ← ty row weight
```

### Mathematical Properties

**Linearity:** Bilinear is linear within each pixel cell. Between adjacent cells, values are continuous but gradients can change (C⁰ continuity, not C¹).

**Commutative:** Order of interpolation (horizontal-first vs vertical-first) produces identical results due to weighted averaging structure.

**Boundary extrapolation:** Clamping at edges means coordinates outside the tile bounds use the nearest edge pixel.

---

## Implementation Details

### Coordinate System: Mercator Y Inversion

This is the **most critical detail**. All elevation sampling depends on correct Y-axis handling.

**The problem:**
- Geographic data uses **Mercator Y** increasing northward (standard)
- PNG pixel grids use **row indices** increasing southward (computer graphics convention)

**The solution:**
```typescript
fracY = 1 - (mercatorY - minY) / (maxY - minY);
```

This single line flips the Y coordinate from geographic (north-positive) to array-index (south-positive) space.

**Verification:**
- `mercatorY = minY` (south edge) → `fracY = 1` → row 255 (southernmost)
- `mercatorY = maxY` (north edge) → `fracY = 0` → row 0 (northernmost)
- `mercatorY = (minY + maxY) / 2` (center) → `fracY = 0.5` → row 127.5 (middle)

All mesh factories account for this when positioning objects. See [Coordinate System](../coordinate-system.md) for full context.

### Pixel Boundary Clamping

```typescript
const px = Math.max(0, Math.min(n - 1, fracX * (n - 1)));
const py = Math.max(0, Math.min(n - 1, fracY * (n - 1)));
```

Clamping prevents the algorithm from attempting to access out-of-bounds pixel indices (e.g., pixel -1 or 256). This is safe because:

1. **Points within tile bounds**: fracX and fracY ∈ [0, 1], so px/py ∈ [0, 255]
2. **Points at exact boundaries**: fracX = 1.0 → px = 255 (valid)
3. **Floating-point rounding**: Rare edge cases where fractional math produces 255.0001 are clamped to 255

**Edge behavior:** When a point is exactly at the boundary between two tiles, only one tile's data is used (the one returned by `getTileAt`). The other tile isn't consulted. This is acceptable because:
- Tiles are loaded in overlapping rings
- Boundary samples are deterministic regardless of which tile "wins"
- Slight height discontinuities at tile seams are imperceptible at 4.77 m resolution

### 4-Point Interpolation

The core interpolation uses values from 4 pixels. If the point lands exactly on a pixel center (tx = 0, ty = 0), the formula simplifies:

```typescript
(v00 * 1 + v01 * 0) * 1 + (v10 * 1 + v11 * 0) * 0 = v00
```

Which is correct—the exact pixel value is returned.

---

## Precision & Accuracy

### Sub-Meter Precision

Terrarium elevation data encodes each pixel as a 24-bit RGB value using the formula:

```
elevation (meters) = (R × 256 + G + B/256) - 32768
```

The **B channel** contributes `B/256`, providing fractional meter precision:
- B = 0 → 0.000 m
- B = 64 → 0.250 m
- B = 128 → 0.500 m
- B = 255 → 0.996 m

This means **each meter is divided into 256 steps**, or **~3.9 mm per step**.

### Interpolation Preserves Precision

Bilinear interpolation blends four integer elevation values. The result is a floating-point value that can have arbitrary precision depending on input values and blending fractions.

**Example:**

```
Tile data (in meters):
v00 = 100.0
v01 = 100.5
v10 = 100.25
v11 = 100.75

Point at (tx=0.5, ty=0.5):
left_interp = 100.0 * (1 - 0.5) + 100.5 * 0.5 = 100.25
right_interp = 100.25 * (1 - 0.5) + 100.75 * 0.5 = 100.5
result = 100.25 * (1 - 0.5) + 100.5 * 0.5 = 100.375 m
```

The interpolated value (100.375 m) is more precise than any single pixel.

### Comparison to Raw Pixel Accuracy

| Level | Precision | Example |
|-------|-----------|---------|
| **Single pixel** | Integer meters (mostly) | v = 100 m |
| **Blue channel** | ~3.9 mm steps | v = 100.004, 100.008, ..., 100.996 m |
| **Interpolated** | Arbitrary precision | v = 100.375 m (1 mm scale) |

In practice, interpolation provides **decimeter-to-centimeter level smoothing** for terrain, which is far better than the 4.77 m horizontal pixel spacing and sufficient for visual 3D placement.

---

## Edge Cases & Special Handling

### Unloaded Tiles

```typescript
const tile = elevationData.getTileAt(mercatorX, mercatorY);
if (!tile) return 0;
```

**Scenario:** Drone is near a tile ring edge, and `getTileAt` returns null because the tile hasn't been fetched yet.

**Behavior:** Returns 0 meters (sea level).

**Impact:**
- Objects placed at unloaded coordinates temporarily appear at sea level
- Once the tile loads, the next animation frame re-samples and corrects the height
- This brief visual hiccup is acceptable because:
  - Tiles load in <100 ms typically
  - Ring loading is ahead of drone motion (configured in `config.ts:ringRadius`)
  - Most objects are visible only when tiles are nearby (tile ring strategy)

### Tile Boundary Sampling

**Scenario:** A coordinate falls exactly on the boundary between two loaded tiles.

**Behavior:** `getTileAt` returns the tile whose bounds contain the point (typically the tile with minimum coordinates if point is on an exact grid line).

**Edge case handling:**
```typescript
const col1 = Math.min(col0 + 1, n - 1);
const row1 = Math.min(row0 + 1, n - 1);
```

If the point lands at column 255 (rightmost pixel), `col1` is clamped to 255, so both `v00` and `v01` reference the same column. This means:
- Interpolation becomes 1D (only horizontal blending is suppressed)
- The right-hand tile's data is never consulted
- Height may differ by a pixel's worth at the exact boundary

This is acceptable because:
- Objects are rarely placed exactly on tile boundaries (float coordinate precision)
- Boundaries are imperceptible at 4.77 m resolution
- Ring-based loading ensures no gaps

### Y-Axis Inversion for Row Indexing

**Scenario:** A Mercator Y value corresponds to a tile's southern (high-index) rows.

**Handling:**
```typescript
const fracY = 1 - (mercatorY - minY) / (maxY - minY);
```

This ensures northward Mercator coordinates map to low row indices (northernmost pixels).

**Verification in code:**
- ElevationSampler.ts: sampleAt() method performs Y-inversion (line 21) ✓
- All mesh factories apply the same Mercator→Three.js conversion (building: Z = -mercatorY, etc.) ✓
- Coordinate consistency verified by tests ✓

### Clamping to Valid Pixel Range

```typescript
const px = Math.max(0, Math.min(n - 1, fracX * (n - 1)));
const py = Math.max(0, Math.min(n - 1, fracY * (n - 1)));
```

**Scenario:** Due to floating-point rounding, `fracX * 255` might be -0.00001 or 255.00001.

**Handling:** Clamp to [0, 254] to ensure valid array access.

**Why safe:**
- `Math.max(0, ...)` prevents negative indices
- `Math.min(n-1, ...)` prevents out-of-bounds access (tile data is 0-indexed [0, 255])
- Clamping loses minimal precision (< 1 mm at map scale)

---

## Performance Characteristics

### Computational Cost

| Operation | Time | Notes |
|-----------|------|-------|
| **Tile lookup** | O(1) | Hash map access via tile key |
| **Arithmetic** | O(1) | 5 additions, 5 multiplications, 3 clamps |
| **Total per sample** | < 1 μs | Negligible; no I/O, no loops |

On modern CPUs, sampling 10,000 elevations takes < 10 ms.

### Memory Usage

- **Object size:** ~8 bytes (single reference to ElevationDataManager)
- **Per-call stack:** ~50 bytes (temporary variables: mercatorBounds, px, py, v00-v11, tx, ty)
- **No allocations:** All values are scalars; no arrays created

### Integration in Animation Loop

ElevationSampler is called during the **mesh creation phase** of the animation loop (as documented in [Animation Loop Architecture](../animation-loop.md)):

```
Frame N:
  1. Apply drone movement
  2. Update tile ring
  3. Load new tiles  ← ElevationDataManager fetch
  4. Create/remove meshes
       ↓
       For each mesh factory:
         elevationSampler.sampleAt(x, y)  ← ~1 μs
       Result: position mesh on terrain
  5. Render scene
```

**Cost:** Even for 1,000 object samples, the total CPU time is < 1 ms (negligible next to rendering).

### Caching Strategy

ElevationSampler itself doesn't cache results. Instead:
- **Tile data is cached** in ElevationDataManager (in-memory + IndexedDB)
- **Mesh positions are cached** (recomputed only when tile changes)
- Sampling is cheap, so per-frame re-evaluation is acceptable

---

## Integration with Mesh Factories

### Pattern: Dependency Injection

ElevationSampler is passed to MeshObjectManager, which distributes it to all mesh factories:

```typescript
// App.tsx: initialization sequence
const elevationSampler = new ElevationSampler(elevationData);
meshObjectManager = new MeshObjectManager(
  viewer3D.getScene(),
  contextData,
  elevationSampler  // Injected here
);
```

Each factory (BuildingMeshFactory, VegetationMeshFactory, etc.) receives this instance and uses it to determine object heights.

### Usage Example: Building Placement

```typescript
// src/visualization/mesh/building/BuildingMeshFactory.ts
const buildingCentroidX = ... // from GeoJSON
const buildingCentroidY = ...

const terrainY = elevationSampler.sampleAt(buildingCentroidX, buildingCentroidY);

// Position building at terrain surface + min_height offset
position.set(buildingCentroidX, terrainY + minHeight, -buildingCentroidY);
```

### Usage Example: Vegetation Distribution

```typescript
// For each tree in forest:
const treeX = ...  // random point within forest polygon
const treeY = ...

const terrainY = elevationSampler.sampleAt(treeX, treeY);
matrix.setPosition(treeX, terrainY + trunkOffset, -treeY);
```

### Lifecycle Integration

ElevationSampler is initialized once at app startup and distributed to all mesh factories. It's used during the **mesh creation phase** of the animation loop to sample terrain elevation. For complete integration details including initialization, animation loop orchestration, and cleanup, see **[3D Object Visualization](../visualization/objects.md#rendering-pipeline)** and **[Ground Surface Rendering](../visualization/ground-surface.md#integration-with-drone-system)**.

### Coordinate System Consistency

All mesh factories use the same formula:

```typescript
position.set(
  mercatorX,
  elevationSampler.sampleAt(mercatorX, mercatorY),  // Y = elevation
  -mercatorY                                         // Z = -mercatorY
);
```

This ensures:
- All objects rest on the same sampled terrain
- X, Y, Z coordinates are consistent (see [Coordinate System](../coordinate-system.md))
- Terrain surface appears continuous

---

## Key Files & References

| File | Purpose |
|------|---------|
| `src/visualization/mesh/util/ElevationSampler.ts` | Implementation (44 lines) |
| `src/data/elevation/ElevationDataManager.ts` | Tile management and lifecycle |
| `src/visualization/mesh/building/BuildingMeshFactory.ts` | Building placement example |
| `src/visualization/mesh/vegetation/vegetationUtils.ts` | Vegetation tree sampling example |
| `doc/coordinate-system.md` | Full coordinate transformation strategy |
| `doc/data/elevations.md` | Terrarium data source and format details |

---

## See Also

- **[Elevation Data System](./elevations.md)** — Terrarium format, tile loading, caching
- **[Coordinate System](../coordinate-system.md)** — Complete coordinate transformation mapping
- **[3D Object Visualization](../objects.md)** — How mesh factories use ElevationSampler
