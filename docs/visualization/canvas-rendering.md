# Canvas Rendering: OSM Feature Rasterization

## Overview

The drone simulator visualizes millions of OpenStreetMap (OSM) features—roads, water bodies, vegetation, landuse areas, railways, and aeroways—by **rasterizing them to a 2D canvas texture**. This approach provides rich visual detail while maintaining performance.

### Why Canvas Textures?

Rendering each OSM feature as an individual 3D mesh would create **millions of geometry objects**, causing:

- Excessive draw calls (GPU bottleneck)
- Memory overhead (vertices + indices per feature)
- CPU overhead during scene management

Instead, features are **rasterized to a 2048×2048 canvas** per tile, then applied as a texture. Result:

- **Single texture per tile** (minimal memory: ~12 MB per canvas)
- **Single mesh per tile** (one draw call per tile)
- **CPU rendering** is fast enough for offline canvas generation

### Architecture at a Glance

```
OSM Context Tile (features)
       ↓
TerrainCanvasRenderer (painter's algorithm)
       ↓
2048×2048 Canvas (rasterized features)
       ↓
Three.js CanvasTexture
       ↓
Applied to terrain mesh (UV mapping)
       ↓
Visible in 3D scene
```

---

## Architecture & Data Flow

### Classes & Components

| Component                    | Responsibility                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| **ContextDataTile**          | Data structure holding parsed OSM features for a tile (buildings, roads, water, vegetation, etc.) |
| **TerrainCanvasRenderer**    | Main rendering engine; draws features to canvas in painter's algorithm order                      |
| **MercatorBounds**           | Spatial bounds object: `{minX, maxX, minY, maxY}` defining tile extents in Mercator coordinates   |
| **CanvasRenderingContext2D** | Standard HTML5 canvas 2D drawing API                                                              |
| **Three.js CanvasTexture**   | Wraps HTML canvas as a Three.js texture; applied to terrain mesh material                         |

### Data Flow Diagram

```
┌─────────────────────────────────────────┐
│   OSM Contextual Data Tile              │
│  (buildings, roads, water, vegetation)  │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│ TerrainCanvasRenderer.renderTile()      │
│  Input: ContextDataTile, MercatorBounds │
└────────────────┬────────────────────────┘
                 │
        (9 drawing layers)
        ├─ clear()          → ground fill
        ├─ drawLanduse()    → landuse areas
        ├─ drawWaterBodies()→ water polygons
        ├─ drawWetlands()   → wetland areas
        ├─ drawWaterwayLines()→ waterway lines
        ├─ drawVegetation() → vegetation areas
        ├─ drawAeroways()   → runway/taxiway
        ├─ drawRoads()      → road lines (sorted)
        └─ drawRailways()   → railway lines
                 │
                 ↓
      ┌──────────────────────┐
      │  2048×2048 Canvas    │
      │  (rasterized image)  │
      └──────────┬───────────┘
                 │
                 ↓
   ┌──────────────────────────┐
   │ Three.js CanvasTexture   │
   │ (GPU texture binding)    │
   └──────────┬───────────────┘
              │
              ↓
   ┌──────────────────────────┐
   │  Terrain Mesh Material   │
   │  (MeshPhongMaterial.map) │
   └──────────┬───────────────┘
              │
              ↓
      ┌──────────────────┐
      │  3D Scene        │
      │  (visible frame) │
      └──────────────────┘
```

---

## Rendering Pipeline (Step-by-Step)

### 1. Tile Data Input

**Source:** `ContextDataManager` provides a parsed `ContextDataTile` object containing:

- Buildings (polygons, areas)
- Roads (lines with width)
- Railways (lines with width and dash pattern)
- Water (polygons for bodies, lines for waterways)
- Vegetation (polygons, lines, points)
- Landuse (polygons, background colors)
- Aeroways (runways, taxiways, helipads)

### 2. Coordinate System Setup

**Input:** Mercator bounds `{minX, maxX, minY, maxY}` for the tile

**Calculation:**

```typescript
const mercatorWidth = mercatorBounds.maxX - mercatorBounds.minX;
const mercatorHeight = mercatorBounds.maxY - mercatorBounds.minY;
const scaleX = width / mercatorWidth; // canvas width = 2048 pixels
const scaleY = height / mercatorHeight; // canvas height = 2048 pixels
```

This maps Mercator coordinates to canvas pixel coordinates:

```
canvasX = (mercatorX - minX) * scaleX
canvasY = (maxY - mercatorY) * scaleY
```

**Why negated?** Canvas Y increases downward; Mercator Y increases upward. Subtracting `mercatorY` from `maxY` flips the coordinate space.

### 3. Canvas Preparation

**Clear with base color:**

```typescript
ctx.fillStyle = groundColors.default; // '#d8c8a8' (tan)
ctx.fillRect(0, 0, 2048, 2048);
```

### 4. Painter's Algorithm: Back-to-Front Drawing

Features are drawn in a specific order so that overlapping features layer correctly. **Wider/larger features are drawn later** to appear on top.

**Layer order (lines 38-52 in `TerrainCanvasRenderer.ts`):**

| #   | Layer          | Method                | Features                                      | Z-Order        |
| --- | -------------- | --------------------- | --------------------------------------------- | -------------- |
| 0   | Ground fill    | `clear()`             | Base tan color                                | Lowest         |
| 1   | Landuse        | `drawLanduse()`       | Parks, forests, residential, farmland         | Background     |
| 2   | Water bodies   | `drawWaterBodies()`   | Lakes, ponds, reservoirs (polygons)           | Mid-background |
| 3   | Wetlands       | `drawWetlands()`      | Marshes, swamps (polygon areas)               | Mid-background |
| 4   | Waterway lines | `drawWaterwayLines()` | Rivers, canals, streams (lines)               | Mid-ground     |
| 5   | Vegetation     | `drawVegetation()`    | Forests, woods, scrub (areas)                 | Mid-ground     |
| 6   | Aeroways       | `drawAeroways()`      | Runways, taxiways, helipads                   | Mid-ground     |
| 7   | Roads          | `drawRoads()`         | Streets, highways (sorted by width ascending) | Foreground     |
| 8   | Railways       | `drawRailways()`      | Rail lines with dashes                        | Highest        |

### 5. Feature Drawing Methods

#### 5.1 Polygon Features (Landuse, Water, Vegetation, Aeroways)

**Method:** `drawPolygon()`

```typescript
for (const ring of polygonRings) {
  for (const [x, y] of ring) {
    canvasX = (x - bounds.minX) * scaleX;
    canvasY = (bounds.maxY - y) * scaleY;
    ctx.moveTo(canvasX, canvasY); // First point
    ctx.lineTo(canvasX, canvasY); // Subsequent points
  }
  ctx.closePath(); // Close ring
}
ctx.fill('evenodd'); // Handle holes correctly
```

**Even-odd fill rule:** For polygons with holes (e.g., a lake with islands), the even-odd rule correctly handles alternate winding. A point is filled if a ray from the point crosses an odd number of boundaries.

#### 5.2 Line Features (Roads, Railways, Waterways)

**Method:** `drawLineString()`

```typescript
ctx.beginPath();
for (const [x, y] of coordinates) {
  canvasX = (x - bounds.minX) * scaleX;
  canvasY = (bounds.maxY - y) * scaleY;
  ctx.moveTo(canvasX, canvasY); // First point
  ctx.lineTo(canvasX, canvasY); // Subsequent points
}
ctx.stroke(); // Draw line
```

**Line properties:**

- `lineWidth` = feature width in meters × `scaleX` (converts Mercator meters to canvas pixels)
- `strokeStyle` = feature color (from config)
- `lineCap` = 'round' (roads) or 'butt' (railways)
- `lineJoin` = 'round' (roads) or 'miter' (railways)

#### 5.3 Point Features (Landmarks, Helipads, Trees)

**Method:** Within specific draw methods (e.g., `drawAeroways()` for helipads)

```typescript
const [x, y] = coordinates;
const canvasX = (x - bounds.minX) * scaleX;
const canvasY = (bounds.maxY - y) * scaleY;
ctx.beginPath();
ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2); // radius in pixels
ctx.fill();
```

### 6. Texture Generation

After all features are drawn, the canvas is converted to a Three.js texture:

```typescript
const texture = new THREE.CanvasTexture(canvas);
texture.magFilter = THREE.NearestFilter; // Close: sharp pixels
texture.minFilter = THREE.LinearMipmapLinearFilter; // Distance: blurred
texture.generateMipmaps = true;
```

This texture is then applied to the terrain mesh material:

```typescript
const material = new THREE.MeshPhongMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
```

---

## Layer Ordering System

### Why Order Matters

The **painter's algorithm** (back-to-front rendering) requires features to be drawn in a specific sequence. Drawing a road before water means water can cover roads incorrectly.

### Sorting Rules

#### Rule 1: Landuse by Area (Descending)

Larger landuse polygons drawn first so smaller ones appear on top:

```typescript
const sorted = [...tile.features.landuse].sort((a, b) => {
  return (
    this.polygonOuterRingArea(b.geometry.coordinates) -
    this.polygonOuterRingArea(a.geometry.coordinates)
  );
});
```

Example: A large grassland drawn first, then smaller park overlays it.

#### Rule 2: Roads by Width (Ascending)

Narrower roads drawn first, wider roads on top:

```typescript
const sorted = [...tile.features.roads].sort(
  (a, b) => a.widthMeters - b.widthMeters
);
```

**Why?** A footpath (2m) behind a motorway (25m) looks wrong. Drawing footpath first ensures motorway appears on top.

#### Rule 3: Special Cases

- **Waterways:** Always use round line caps/joins (line 161-162)
- **Roads:** Always use round line caps/joins (line 278-279)
- **Railways:** Use butt/miter (line 303-304) for sharp corners
- **Steps roads:** Apply dash pattern `[2, 2]` (line 282)

---

## Coordinate System Transformation

### Input: Mercator Coordinates (Geographic)

OSM features arrive with coordinates in **Mercator projection**:

- **X:** Increases eastward (longitude)
- **Y:** Increases northward (latitude)
- **Units:** Meters (Web Mercator EPSG:3857)

Example: Paris = (261,700 m, 6,250,000 m)

### Output: Canvas Pixel Coordinates (Raster)

Canvas is a 2048×2048 pixel image:

- **X:** 0 to 2048 (left to right)
- **Y:** 0 to 2048 (top to bottom, inverted from Mercator)
- **Units:** Pixels

### Transformation Formula

Given Mercator bounds `{minX, maxX, minY, maxY}` and canvas size `{width=2048, height=2048}`:

```
Scale factors:
  scaleX = width / (maxX - minX)    // pixels per Mercator meter (X)
  scaleY = height / (maxY - minY)   // pixels per Mercator meter (Y)

Transformation:
  canvasX = (mercatorX - minX) * scaleX
  canvasY = (maxY - mercatorY) * scaleY
```

### Why Inverted Y?

**Canvas Y increases downward.** To align with Mercator (Y increases northward), we subtract from `maxY`:

```
canvasY = (maxY - mercatorY) * scaleY
        ↓
North (high mercatorY) → low canvasY (top of canvas)
South (low mercatorY)  → high canvasY (bottom of canvas)
```

### Implementation Locations

Code lines where transformation occurs:

| Location                           | Context                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `TerrainCanvasRenderer.ts:40-43`   | Scale factor calculation in `renderTile()`            |
| `TerrainCanvasRenderer.ts:338-339` | Polygon coordinate transform in `drawPolygon()`       |
| `TerrainCanvasRenderer.ts:367-368` | LineString coordinate transform in `drawLineString()` |
| `TerrainCanvasRenderer.ts:215-216` | Point coordinate transform (vegetation example)       |
| `TerrainCanvasRenderer.ts:257-258` | Point coordinate transform (aeroways example)         |

---

## Feature Drawing Algorithms

### Polygon Drawing (Buildings, Water, Landuse, Vegetation, Aeroways)

**Input:** Multiple rings (outer + holes)

```typescript
drawPolygon(
  ctx: CanvasRenderingContext2D,
  rings: [number, number][][],
  bounds: MercatorBounds,
  scaleX: number,
  scaleY: number,
  fill: boolean,
  stroke: boolean
): void {
  ctx.beginPath();

  // Draw outer ring and all hole rings
  for (const ring of rings) {
    for (const [x, y] of ring) {
      const canvasX = (x - bounds.minX) * scaleX;
      const canvasY = (bounds.maxY - y) * scaleY;
      ctx.moveTo(canvasX, canvasY);  // First point
      // or ctx.lineTo() for subsequent points
    }
    ctx.closePath();  // Close each ring
  }

  // Fill using even-odd rule (handles holes)
  if (fill) ctx.fill('evenodd');
  if (stroke) ctx.stroke();
}
```

**Key feature:** `fill('evenodd')` correctly handles polygons with holes. A lake with islands renders correctly: island interiors are holes (not filled), surrounded by water.

### LineString Drawing (Roads, Railways, Waterways)

**Input:** Ordered sequence of coordinates

```typescript
drawLineString(
  ctx: CanvasRenderingContext2D,
  coordinates: [number, number][],
  bounds: MercatorBounds,
  scaleX: number,
  scaleY: number
): void {
  if (coordinates.length < 2) return;

  ctx.beginPath();
  let firstPoint = true;

  for (const [x, y] of coordinates) {
    const canvasX = (x - bounds.minX) * scaleX;
    const canvasY = (bounds.maxY - y) * scaleY;

    if (firstPoint) {
      ctx.moveTo(canvasX, canvasY);
      firstPoint = false;
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }

  ctx.stroke();
}
```

**Properties before calling:**

- `ctx.strokeStyle` = color (e.g., '#777060' for roads)
- `ctx.lineWidth` = width in pixels (`feature.widthMeters * scaleX`)
- `ctx.lineCap` = 'round' or 'butt'
- `ctx.lineJoin` = 'round' or 'miter'
- `ctx.setLineDash()` = pattern for roads (steps: `[2, 2]`), railways, etc.

### Point Drawing (Landmarks, Helipads, Trees)

**Input:** Single [x, y] coordinate

```typescript
const [x, y] = feature.geometry.coordinates;
const canvasX = (x - bounds.minX) * scaleX;
const canvasY = (bounds.maxY - y) * scaleY;

ctx.beginPath();
ctx.arc(canvasX, canvasY, radiusPixels, 0, Math.PI * 2);
ctx.fill();
```

**Examples:**

- Helipad: radius = 4 pixels (line 260)
- Vegetation point: radius = 2 pixels (line 218)

---

## Feature Types, Colors & Configuration

### All Supported Features

| Feature Type     | OSM Key           | Example Sub-Types                                                      | Canvas Drawing Method    | Color Config                           | Width/Dash                                                |
| ---------------- | ----------------- | ---------------------------------------------------------------------- | ------------------------ | -------------------------------------- | --------------------------------------------------------- |
| **Landuse**      | `landuse`         | grassland, farmland, residential, commercial, industrial, park, forest | Polygon                  | `groundColors.landuse.*`               | N/A                                                       |
| **Water bodies** | `natural=water`   | lake, pond, reservoir                                                  | Polygon                  | `groundColors.water.body` (#3a6ab0)    | N/A                                                       |
| **Waterways**    | `waterway`        | river, canal, stream                                                   | LineString               | `groundColors.water.line` (#3a6ab0)    | From `waterwayWidthsMeters`                               |
| **Wetlands**     | `natural=wetland` | marsh, bog, swamp                                                      | Polygon                  | `groundColors.water.wetland` (#5a9a6a) | N/A                                                       |
| **Vegetation**   | `natural`         | wood, forest, scrub, heath, fell, tundra                               | Polygon/LineString/Point | `groundColors.vegetation.*` (#3a7a30)  | 0.5px (line) or 2px (point)                               |
| **Aeroways**     | `aeroway`         | aerodrome, runway, taxiway, apron, helipad                             | Polygon/LineString/Point | `groundColors.aeroways.*`              | From feature or 45m/4px                                   |
| **Roads**        | `highway`         | motorway, primary, residential, footway, track, path                   | LineString               | `roadSpec.*.color` + `surfaceColors`   | From `roadSpec.*.widthMeters` + special `[2,2]` for steps |
| **Railways**     | `railway`         | rail, light_rail, tram, metro, monorail, disused                       | LineString               | `railwaySpec.*.color` (#888888)        | From `railwaySpec.*.widthMeters` + `dash` pattern         |

### Color Values (from `src/config.ts`)

#### Landuse Colors

```typescript
groundColors.landuse = {
  grassland: '#90b860', // Green
  farmland: '#c0cc70', // Light green
  residential: '#d8d4cc', // Tan
  commercial: '#d8d4cc', // Tan
  industrial: '#d8d4cc', // Tan
  forest: '#3a7a30', // Dark green
  park: '#90b860', // Green
  // ... 20+ more types
};
```

#### Water Colors

```typescript
groundColors.water = {
  body: '#3a6ab0', // Deep blue (lakes, ponds)
  line: '#3a6ab0', // Deep blue (rivers, streams)
  wetland: '#5a9a6a', // Teal (marshes, swamps)
};
```

#### Vegetation Colors

```typescript
groundColors.vegetation = {
  wood: '#3a7a30', // Dark green (woods, forests)
  forest: '#3a7a30', // Dark green
  scrub: '#5a8a40', // Medium green (bushes, scrub)
  // ... 3 more types
};
```

#### Aeroway Colors

```typescript
groundColors.aeroways = {
  aerodrome: '#d8d4c0', // Light tan (airport grounds)
  runway: '#888880', // Dark gray (landing strip)
  taxiway: '#999990', // Medium gray (aircraft path)
  helipad: '#ccccaa', // Pale yellow (helicopter landing)
};
```

#### Road Colors & Widths

```typescript
roadSpec = {
  motorway: { widthMeters: 25, color: '#777060' },
  trunk: { widthMeters: 20, color: '#777060' },
  primary: { widthMeters: 15, color: '#777060' },
  residential: { widthMeters: 7, color: '#777060' },
  footway: { widthMeters: 2, color: '#ccccbb' },
  track: { widthMeters: 3, color: '#c4a882' },
  // ... 15+ more types
};
```

#### Railway Widths & Dashes

```typescript
railwaySpec = {
  rail: { widthMeters: 4, dash: [5, 3], color: '#888888' },
  light_rail: { widthMeters: 3, dash: [4, 3], color: '#888888' },
  tram: { widthMeters: 2, dash: [4, 3], color: '#888888' },
  metro: { widthMeters: 4, dash: [4, 3], color: '#888888' },
  disused: { widthMeters: 2, dash: [2, 4], color: '#aaaaaa' },
  // ... 4 more types
};
```

#### Waterway Widths

```typescript
waterwayWidthsMeters = {
  river: 20,
  canal: 15,
  stream: 5,
  tidal_channel: 10,
  ditch: 2,
  drain: 2,
};
```

### Canvas Drawing Settings (from Code)

| Feature Type | fillStyle       | strokeStyle                         | lineWidth                      | lineCap | lineJoin | lineDash                     |
| ------------ | --------------- | ----------------------------------- | ------------------------------ | ------- | -------- | ---------------------------- |
| Landuse      | `lu.color`      | N/A                                 | N/A                            | N/A     | N/A      | N/A                          |
| Water bodies | `water.color`   | N/A                                 | N/A                            | N/A     | N/A      | N/A                          |
| Waterways    | N/A             | `water.color`                       | `water.widthMeters * scaleX`   | 'round' | 'round'  | `[]`                         |
| Vegetation   | `veg.color`     | N/A                                 | N/A                            | N/A     | N/A      | N/A                          |
| Aeroways     | `aeroway.color` | `aeroway.color`                     | width varies                   | N/A     | N/A      | `[]`                         |
| Roads        | N/A             | `road.surfaceColor \|\| road.color` | `road.widthMeters * scaleX`    | 'round' | 'round'  | `[2,2]` for steps, `[]` else |
| Railways     | N/A             | `railway.color`                     | `railway.widthMeters * scaleX` | 'butt'  | 'miter'  | `railway.dash`               |

---

## Performance Characteristics

### Canvas Size: 2048×2048

**Trade-off:**

- **Pro:** High detail, crisp roads/features at close range
- **Con:** CPU rendering time increases with size

Calculation:

```
Pixels per meter = 2048 / tileWidth
At zoom 15, tileWidth ≈ 40,075 meters
Pixels per meter ≈ 0.051 (very high detail)
```

### Redraw Frequency

Canvas is **redrawn once per tile load**, not every frame:

- **Cost:** CPU time once per new tile
- **Benefit:** No per-frame overhead after initial load

### Memory Usage

**Per-tile memory:**

```
2048 × 2048 × 4 bytes (RGBA) ≈ 16 MB
However, WebGL mipmapping doubles this ≈ 32 MB
Typical visible tiles: 3×3 grid = ~288 MB maximum
```

**Caching:** In-memory `Map` holds ~9 tiles; total ~2-3 MB for parsed data.

### Concurrency

Contextual tiles load with concurrency control:

```typescript
maxConcurrentLoads: 3; // Max 3 simultaneous tile fetches
```

Canvas rendering is **synchronous** but fast (typically <100ms per 2048×2048 canvas).

---

## Edge Cases & Limitations

### Polygon Holes (Even-Odd Rule)

**Challenge:** Lakes with islands, buildings with courtyards

**Solution:** `ctx.fill('evenodd')` correctly handles alternate winding:

```
Island hole:   Ring boundary crossed 1 time → Not filled (correct)
Lake water:    Ring boundary crossed 0 times → Filled (correct)
```

**Limitation:** Self-intersecting boundaries may not render correctly with all canvas implementations. In practice, OSM data is clean enough that this is rarely an issue.

### Self-Intersecting Boundaries

**Challenge:** Malformed polygons with self-crossing edges

**Behavior:** Canvas API handles automatically; visual artifact depends on fill rule. OSM validation is strict, so this is extremely rare.

### Tile Boundary Features

**Challenge:** Feature spans two adjacent tiles (e.g., a road crossing tile boundary)

**Solution:** Coordinate transformation naturally clips to tile bounds. Features are drawn in their local tile space; boundaries align perfectly.

**Result:** Roads and rivers appear seamless across tile boundaries because each tile transforms coordinates independently to its own canvas space, then meshes are placed adjacent in 3D space.

### Seamless Boundary Alignment

Tiles are positioned at **tile centers** in Mercator space:

```typescript
meshPosition.x = tileCenter_mercatorX;
meshPosition.z = -tileCenter_mercatorY; // Z-negated
```

Canvas bounds match tile extent perfectly:

```
Canvas pixel (0, 0)      ↔ Mercator (minX, maxY)
Canvas pixel (2048, 0)   ↔ Mercator (maxX, maxY)
Canvas pixel (0, 2048)   ↔ Mercator (minX, minY)
Canvas pixel (2048, 2048)↔ Mercator (maxX, minY)
```

This ensures **pixel-perfect alignment** at tile boundaries.

### Very Large Features

**Challenge:** A feature much larger than the tile

**Behavior:** Feature is clipped to tile bounds during coordinate transformation. Only the visible portion within the tile is rendered.

**Limitation:** If a major road enters tile at one edge and exits at another, only the segment between entry/exit is visible. Adjacent tiles render their portions; together they form the complete road.

### Tree & Tree Row Exclusion

**Important:** `tree` and `tree_row` OSM features are **excluded from canvas**:

```typescript
if (veg.type === 'tree' || veg.type === 'tree_row') continue; // Line 188
```

**Reason:** Individual trees are rendered as **3D mesh objects** (cones/spheres) in the scene, not canvas textures. Tree rows are similarly 3D.

---

## Integration with Other Systems

### TerrainTextureFactory

**Relationship:** `TerrainTextureFactory` **uses** `TerrainCanvasRenderer`

```typescript
// In TerrainTextureFactory.ts
const canvas = new OffscreenCanvas(2048, 2048);
const renderer = new TerrainCanvasRenderer();
renderer.renderTile(canvas, contextTile, mercatorBounds);
const texture = new THREE.CanvasTexture(canvas);
```

### Terrain Mesh System

**Flow:**

```
TerrainCanvasRenderer (canvas) → TerrainTextureFactory (texture) → TerrainObjectFactory
                                                                           ↓
                                                               Three.js Mesh + Material
```

The canvas texture is applied to the terrain mesh via the material's `.map` property. The mesh is positioned using Mercator → Three.js transformation:

```typescript
position.x = mercatorX;
position.y = 0;
position.z = -mercatorY; // Z-negated (critical!)
```

### Coordinate Consistency

Canvas rendering uses **identical transformation** as all other components:

| Component                                       | Transformation |
| ----------------------------------------------- | -------------- |
| Canvas: `canvasY = (maxY - mercatorY) * scaleY` | Inverts Y      |
| Terrain geometry: Z vertices use `-mercatorY`   | Inverts Y      |
| Drone position: Z = `-mercatorY`                | Inverts Y      |
| Camera: lookAt uses Z negation                  | Inverts Y      |

**Guarantee:** All components use the same formula. Buildings, roads, and terrain align perfectly in 3D space.

### Event-Driven Pipeline

**Animation loop flow:**

```
Step 1: Drone moves (Drone.applyMove)
   ↓
Step 2: Elevation tiles load (ElevationDataManager)
   ↓
Step 3: Context tiles load (ContextDataManager)
   ↓
Step 4: Canvas rendered (TerrainCanvasRenderer)
   ↓
Step 5: Texture applied (TerrainTextureFactory)
   ↓
Step 6: Mesh created (TerrainObjectFactory)
   ↓
Step 7: Scene updates (TerrainObjectManager)
   ↓
Step 8: Render (Three.js renderer)
   ↓
Step 9: Next frame
```

Canvas rendering happens via `TerrainTextureObjectManager` listening to context tile events.

---

## Key Implementation Files

### Main Engine

| File                                                         | Lines | Purpose                                              |
| ------------------------------------------------------------ | ----- | ---------------------------------------------------- |
| `src/visualization/terrain/texture/TerrainCanvasRenderer.ts` | 1-380 | Canvas rendering engine (9 drawing methods)          |
| `src/visualization/terrain/texture/TerrainTextureFactory.ts` | ~80   | Creates CanvasTexture from canvas                    |
| `src/visualization/terrain/TerrainTextureObjectManager.ts`   | ~100  | Listens to context tiles, triggers canvas generation |

### Configuration

| File            | Lines   | Purpose                                           |
| --------------- | ------- | ------------------------------------------------- |
| `src/config.ts` | 295-348 | `groundColors` object (all feature colors)        |
| `src/config.ts` | 353-429 | `roadSpec`, `railwaySpec`, `waterwayWidthsMeters` |
| `src/config.ts` | 465-469 | `textureConfig.groundCanvasSize` (2048)           |

### Integration Points

| File                                        | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `src/data/contextual/ContextDataManager.ts` | Provides tiles to TextureObjectManager |
| `src/data/contextual/types.ts`              | ContextDataTile, feature types         |
| `src/gis/types.ts`                          | MercatorBounds definition              |

### Related Documentation

For OSM feature specifications, data fetching, and tag extraction strategies, see **[Contextual Data System](../data/contextual.md)**. This document covers the data interpretation side; canvas-rendering.md handles the visualization rendering.

### Testing

- `src/visualization/terrain/texture/TerrainCanvasRenderer.test.ts` (if exists) - Unit tests for rendering

## See Also

- **[Glossary](../glossary.md)** - Definitions of all technical terms
