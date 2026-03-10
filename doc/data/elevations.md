# Elevation Data System

## Overview

The drone simulator uses global elevation data from **AWS Terrarium**, a tile-based elevation service by Mapbox. This system provides:

- **Real-world elevation** at your location with sub-meter precision
- **Efficient tile loading** using Web Mercator projection with z/x/y coordinates
- **Ring-based caching** around the drone to minimize network requests
- **Seamless integration** with the 3D visualization pipeline

Elevation data flows through the system like this:

```
AWS Terrarium (PNG)
       ↓
ElevationDataManager (loads/caches tiles around drone)
       ↓
ElevationDataTileParser (decodes Terrarium PNG format)
       ↓
Elevation grid [256×256] (elevation values in meters)
       ↓
TerrainGeometryFactory (creates Three.js mesh)
       ↓
3D Visualization (terrain surface in scene)
```

## Data Source & Fetching

### AWS Terrarium

**Service:** AWS S3 - Elevation Tiles (Terrarium format)
**Endpoint:** `https://s3.amazonaws.com/elevation-tiles-prod/terrarium`
**License:** [CC0 - Public Domain](https://creativecommons.org/publicdomain/zero/1.0/)

Terrarium is maintained by Mapbox and provides global elevation coverage at multiple zoom levels.

### Why Terrarium?

- **Global coverage** - elevation data for entire planet
- **Efficient format** - PNG-encoded tiles minimize bandwidth
- **Well-documented** - straightforward RGB formula with sub-meter precision
- **Reliable** - mature service with excellent uptime
- **Public domain** - no licensing restrictions

### Ring-Based Loading

The system maintains a **ring of tiles** around the drone's current position:

```
Drone at center of ring:

        [ ][ ][ ]
        [ ][D][ ]    ← Ring radius = 1 means 3×3 grid (9 tiles)
        [ ][ ][ ]

Tiles load as drone approaches edges, unload as it leaves the ring.
```

**Configuration** (in `src/config.ts`):

```typescript
elevationConfig = {
  zoomLevel: 15,              // Detail level: 15 = ~4.77m per pixel
  ringRadius: 1,              // Number of tiles in each direction
  maxConcurrentLoads: 3,      // Max simultaneous downloads
  elevationEndpoint: '...',   // AWS S3 endpoint
}
```

### Performance Strategy

| Setting | Purpose |
|---------|---------|
| **zoomLevel: 15** | Balances detail (higher = more tiles but finer resolution) with performance |
| **ringRadius: 1** | 3×3 grid = 9 tiles total; expands to 5×5 (25 tiles) if set to 2 |
| **maxConcurrentLoads: 3** | Prevents network saturation; browser limits ~6 concurrent HTTP connections |
| **Ring updates** | Only when drone crosses tile boundary, not continuously |

### Caching Layers

The system implements **two caching strategies**:

1. **In-memory cache** (RAM)
   - Fastest access during gameplay
   - Automatically cleared when tiles leave the ring
   - Provides instant elevation queries

2. **Persistent cache** (IndexedDB)
   - Survives page reloads
   - 24-hour TTL prevents stale data
     (See [Context Data System](./contextual.md) — both systems use the same TTL
     for consistency and simplified cache management)
   - Gracefully falls back to network if expired

## Technical Specification

### File Format: PNG

Elevation tiles are **256×256 pixel PNG images** where each pixel encodes an elevation value using the Terrarium RGB formula.

**Encoding Method:**
```
Pixel Color (R, G, B) → Elevation (meters)
```

### Terrarium RGB Formula

Each pixel's RGB channels encode elevation with sub-meter precision:

```
elevation = (R × 256 + G + B/256) - 32768
```

**Breaking it down:**

- **R channel** (0-255): Coarse elevation in 256-meter increments
  - R = 128 → middle reference (0 meters after offset)
  - R = 129 → +256 meters
  - R = 127 → -256 meters

- **G channel** (0-255): 1-meter precision
  - Each unit in G = 1 meter of elevation
  - Combines with R for larger ranges

- **B channel** (0-255): Sub-meter precision via fractional part
  - B/256 provides 0 to 0.996 meter precision (0.004m = ~4mm steps)
  - Enables sub-meter accuracy

- **-32768 offset**: Shifts range to include negative elevations
  - Allows representation of **below sea level** (Dead Sea: ~-430m)

**Examples:**

| RGB Value | Elevation | Description |
|-----------|-----------|-------------|
| (128, 0, 0) | 0m | Sea level |
| (129, 0, 0) | 256m | Mid-mountain |
| (162, 144, 0) | 8848m | Mount Everest (approx) |
| (64, 0, 0) | -8192m | Ocean depths |
| (128, 0, 64) | 0.25m | Beach, sub-meter precision |

### Precision & Accuracy

| Aspect | Value | Notes |
|--------|-------|-------|
| **Vertical precision** | ~0.004m (4mm) | Blue channel contributes fractional meter |
| **Horizontal resolution** | ~4.77m per pixel | At zoom 15; finer at higher zoom levels |
| **Elevation range** | -32,768 to +32,767.996m | Sufficient for Earth's topography |
| **Tile size** | 256×256 pixels | Standard Web Mercator tile |
| **Data format** | RGBA PNG | Alpha channel present but unused |

### 2D Array Structure

Elevation data is stored as a **row-major 2D array**:

```typescript
data: number[][]        // Row-major grid
data[0][0]             // Top-left pixel (northwest corner)
data[255][255]         // Bottom-right pixel (southeast corner)
```

**Grid indices:**
```
     0    1    2  ... 255 (columns / X direction)
0    ↓    ↓    ↓
1    ↓    ↓    ↓
2    ↓    ↓    ↓
...  ↓    ↓    ↓
255  ↓    ↓    ↓
(rows / Y direction)
```

## Spatial Organization: Web Mercator

### Web Mercator Projection (EPSG:3857)

The elevation tiles use **Web Mercator coordinates** to align with GPS/mapping systems:

**Axes:**
- **X** increases **eastward** (positive direction = toward 180°)
- **Y** increases **northward** (positive direction = toward North Pole)
- **Bounds** at zoom 15: X from 0 to 2^15 - 1, Y from 0 to 2^15 - 1

**Key property:** Mercator is conformal, preserving angles but distorting area toward poles.

### Tile Coordinate System: z/x/y

Each tile is uniquely identified by **zoom level and grid position**:

```
z = zoom level        (0-28; higher = more tiles, finer detail)
x = column index      (0 to 2^z - 1, left to right)
y = row index         (0 to 2^z - 1, top to bottom)
```

**Example: Zoom 15**
- Total tiles: 2^15 × 2^15 = 32,768 × 32,768
- Each tile covers ~4.77km × ~4.77km at equator
- Grid wraps east-west; y=0 is northernmost

### Converting GPS to Tile Coordinates

Given a GPS location (latitude, longitude), the system:

1. **Converts to Mercator meters** using standard Web Mercator formula
2. **Finds tile containing the point** by dividing by tile size at zoom level
3. **Loads the 3×3 ring** of tiles around the tile center

```
GPS (48.853°N, 2.350°E)
    ↓
Mercator (261,700m, 6,250,000m)
    ↓
Tile at zoom 15: z=15, x=16,383, y=10,904
    ↓
Ring: tiles (x±1, y±1) at same zoom
```

### Geographic Grid Visualization

At zoom 15, tiles form a global grid:

```
Zoom 15: 32,768 × 32,768 tiles covering entire Earth

North Pole
    ↑
    | ... [many tiles] ...
    |
    +--- Equator
    |
    | ... [many tiles] ...
    ↓
South Pole (approximately)

Each tile = 256×256 pixels of elevation data
```

## Decoding & Interpretation

### Parsing Pipeline

When a tile is requested:

```
1. Fetch PNG from AWS Terrarium
   └─ GET: https://s3.amazonaws.com/.../15/16383/10904.png

2. Browser decodes PNG to pixel grid
   └─ Returns Uint8ClampedArray with RGBA values

3. Extract RGB, apply Terrarium formula
   └─ elevation = (R × 256 + G + B/256) - 32768

4. Build 2D array [row][column]
   └─ Ready for elevation sampling

5. Cache tile for reuse
   └─ In-memory + IndexedDB persistence
```

### Elevation Sampling at Arbitrary Coordinates

A drone at a precise Mercator location doesn't align perfectly with the tile's 256×256 grid. The system uses **bilinear interpolation**:

```
Tile grid:     Drone location:
[0][1][2]           ○ (between pixels)
[3][4][5]
[6][7][8]

Elevation = weighted average of 4 nearby pixels
            based on position within the square
```

This provides smooth elevation transitions between the discrete pixel samples.

### Sub-Meter Precision in Practice

The blue channel allows elevation differences as small as **~4mm**:

```
Sea level:        RGB(128, 0, 0)   → 0m
With 1cm offset:  RGB(128, 0, 2.56) → 0.01m (not possible - integer only)
Nearest step:     RGB(128, 0, 3)    → 0.012m ≈ 1.2cm
```

**Why it matters:**
- Building roofs distinguish from ground level
- Subtle slopes render smoothly
- No visible stepping in terrain

## Integration with Drone System

### Lifecycle: Load & Unload

Tiles automatically load and unload as the drone moves:

1. **Initialization** (App.tsx, onMount)
   - ElevationDataManager subscribes to drone's `locationChanged` event
   - Initial ring of tiles begins loading

2. **Per-frame update** (AnimationLoop)
   - `elevationData.setLocation(drone.location)` called with drone's current position
   - If drone crossed tile boundary, update ring:
     - Unload tiles outside ring
     - Queue new tiles for loading
     - Respect maxConcurrentLoads limit

3. **Cleanup** (App.tsx, onCleanup)
   - Abort pending downloads
   - Clear caches
   - Unsubscribe from drone events

**Event emissions:**
```typescript
// Tile finished loading and is cached
tileAdded: { key: "15/16383/10904", tile: ElevationDataTile }

// Tile removed from ring
tileRemoved: { key: "15/16383/10904" }
```

### Visualization: From Tile to 3D Mesh

The elevation grid becomes a visible terrain surface:

```
ElevationDataTile (256×256 grid of elevation values)
    ↓
TerrainGeometryFactory
    ├─ Creates vertex positions from elevation grid
    ├─ Calculates surface normals for lighting
    └─ Generates face indices (triangles)
    ↓
Three.js BufferGeometry
    ↓
Mesh (with PhongMaterial for realistic shading)
    ↓
Scene (rendered each frame)
```

Each tile becomes a **mesh with~131,000 vertices** (256×256 grid, 2 triangles per square).

### Animation Frame Order

Elevation loading integrates into the standard animation frame sequence. See [Animation Loop Architecture](../animation-loop.md) for the complete frame timing and detailed step-by-step breakdown.

**Key constraint:** Elevation data must update **before** terrain mesh creation (step 2 before step 4) so that meshes have height data available when they are created.

### Coordinate Consistency: Mercator to Three.js

**Critical transformation** (see `doc/coordinate-system.md` for details):

The drone simulation uses Mercator coordinates internally but renders in Three.js space. Elevation data respects this mapping:

```
Mercator (world coordinates):
  location.x = eastward
  location.y = northward (increases northward)
  elevation = upward

Three.js (rendering coordinates):
  position.x = +X eastward (same as Mercator X)
  position.y = +Y upward (same as elevation)
  position.z = -Y northward! (Mercator Y negated)
```

**Why negate Z?**

Three.js default camera looks along **-Z**. By mapping `z = -mercator.y`, north (increasing Mercator Y) becomes the camera's forward direction. This is the **single most important coordinate transform** in the system.

**Verification:** All elevation consumers (terrain meshes, camera, drone object) use the same formula.

## Performance & Caching

### Network Efficiency

**Concurrency control prevents network saturation:**

```
maxConcurrentLoads = 3

Queue:  [tile1, tile2, tile3, tile4, tile5]
        Loading...
        When one finishes, next starts
        Never more than 3 simultaneous connections
```

**Benefits:**
- Browsers allow ~6 concurrent connections per host
- Leaving headroom for other requests (UI, textures, etc.)
- Smoother degradation on slow networks

**Tile sizes:**
- ~15-30 KB per tile (PNG compression varies by terrain roughness)
- Flat areas: smaller files (~ 15KB)
- Mountains: larger files (~ 30KB)
- Ring of 9 tiles (3×3) = ~150-250 KB per ring load

### Memory Management

**In-memory cache:**
```
Cache entry = 256×256 float array ≈ 256KB per tile
Ring of 9 tiles ≈ 2.3 MB RAM
Surrounding ring of 25 tiles ≈ 6.4 MB RAM
```

**Automatic eviction:**
- When drone leaves ring, old tiles immediately deleted
- No manual garbage collection needed
- Ring-based design prevents unbounded growth

### Persistent Cache (IndexedDB)

Tiles are stored in browser's IndexedDB for offline playback:

```
Key: "elevation:15:16383:10904"
Value: {
  data: [number][][],     // The elevation grid
  storedAt: timestamp,     // When cached
  expiresAt: timestamp     // When to refetch (30 days)
}
```

**Benefits:**
- Returning to same location loads instantly
- Works offline if tiles are cached
- No double-fetches within 30-day window

**TTL strategy:**
- 30-day expiration handles seasonal updates (landslides, erosion)
- Can be tuned based on accuracy requirements

### Graceful Degradation

If tile loading fails:

1. **Network error** → Log warning, continue with other tiles
2. **Abort signal** (on dispose) → Stop pending requests gracefully
3. **Missing tile in grid** → Terrain geometry fills with default elevation (0m)
4. **Offline mode** → Uses IndexedDB cache; shows "last known" elevation

## Key Files & References

| File | Purpose |
|------|---------|
| `src/config.ts` | Configuration (zoom, ring, concurrency) |
| `src/data/elevation/types.ts` | Data structures (TileCoordinates, ElevationDataTile) |
| `src/data/elevation/ElevationDataTileParser.ts` | Terrarium RGB formula + PNG decoding |
| `src/data/elevation/ElevationDataManager.ts` | Ring management, load orchestration |
| `src/data/elevation/ElevationDataTileLoader.ts` | Network requests, caching, retries |
| `src/gis/types.ts` | Mercator/Three.js coordinate conversion |
| `doc/coordinate-system.md` | Detailed coordinate mapping strategy |

## Glossary

- **Terrarium** - Mapbox's PNG-based elevation tile service
- **Web Mercator** (EPSG:3857) - GPS-aligned projection; X=east, Y=north
- **z/x/y** - Tile coordinate system (zoom level, column, row)
- **Ring** - Set of tiles around drone center; updates as drone moves
- **Bilinear interpolation** - Smooth elevation between tile pixels
- **Conformal projection** - Preserves angles; Mercator property
- **Tile size** - 256×256 pixels per tile (standard Web Mercator)
- **Sub-meter precision** - Blue channel enables ~4mm accuracy
