# Contextual Data System

## Overview

The drone simulator uses **OpenStreetMap (OSM)** data fetched via the **Overpass API** to render the environment's features and landmarks. This system provides:

- **Real-world buildings, roads, railways, water** and other structures
- **Efficient tile loading** using Web Mercator projection with z/x/y coordinates at zoom level 15
- **Ring-based caching** around the drone to minimize API requests
- **Dual rendering** - 2D canvas textures on terrain + 3D meshes in the scene
- **Graceful degradation** when cache or API is unavailable

Contextual data flows through the system like this:

```
OpenStreetMap (via Overpass API)
       ↓
ContextDataManager (loads/caches tiles around drone)
       ↓
ContextDataTileParser (parses OverpassJSON, classifies features)
       ↓
Feature categories:
  - Buildings (3D extrusion to canvas + mesh)
  - Roads (canvas texture)
  - Railways (canvas texture with dashes)
  - Water (canvas texture)
  - Vegetation (3D meshes for dense areas)
  - Landuse (canvas background color)
  - Aeroways (runways, taxiways, helipads)
  - Structures (towers, chimneys, poles)
  - Barriers (walls, hedges)
       ↓
TerrainTextureObjectManager (renders to canvas for terrain)
       ↓
MeshObjectManager (creates 3D meshes for buildings, trees, structures)
       ↓
3D Visualization (textured terrain + 3D objects in scene)
```

## Data Source & Fetching

### OpenStreetMap & Overpass API

**Service:** Overpass API - Open-source geospatial query service
**Available Endpoints:**
- `https://overpass-api.de/api/interpreter` (primary)
- `https://maps.mail.ru/osm/tools/overpass/api/interpreter` (Mirror, currently used)

**License:** [Open Data Commons Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/)

Overpass API is a read-only service allowing complex spatial queries of OpenStreetMap data. It returns geospatial features in OverpassJSON format (GeoJSON variant).

### Why Overpass API?

- **Global coverage** - all OSM data for any location
- **Structured queries** - fetch specific feature types (buildings, roads, water, etc.)
- **Geospatial queries** - bounding box filtering at tile scale
- **Open source** - no API keys required
- **OverpassQL language** - powerful, well-documented query syntax
- **Reliable mirrors** - multiple endpoints available for redundancy

### Ring-Based Loading

The system maintains a **ring of tiles** around the drone's current position. Tiles load as the drone approaches ring edges and unload when it leaves, keeping memory usage constant and network requests minimal.

For detailed ring patterns, lifecycle, lifecycle phases, and spatial organization, see [`doc/tile-ring-system.md`](../tile-ring-system.md).

**Configuration** (in `src/config.ts`):

```typescript
contextDataConfig = {
  zoomLevel: 15,                    // Detail level: zoom 15
  ringRadius: 1,                    // Number of tiles in each direction (3×3 grid)
  maxConcurrentLoads: 3,            // Max simultaneous Overpass requests
  queryTimeout: 30000,              // Query timeout in milliseconds
  overpassEndpoint: '...',          // Overpass API endpoint
}
```

### Performance Strategy

| Setting | Purpose |
|---------|---------|
| **zoomLevel: 15** | Balances detail vs. performance; ~1.22 km × 1.22 km per tile (Web Mercator); often rounded to ~2 km |
| **ringRadius: 1** | 3×3 grid = 9 tiles total; expands to 5×5 (25 tiles) if set to 2 |
| **maxConcurrentLoads: 3** | Respects Overpass API rate limits; prevents network saturation |
| **queryTimeout: 30000** | 30-second timeout per query (Overpass can be slow for large tiles) |
| **Ring updates** | Only when drone crosses tile boundary, not continuously |

### Query Generation

The system generates **OverpassQL queries** that request all 9 feature types within a tile's bounding box:

```
Example query structure:
[out:json][timeout:30];(
  node["building"](bbox);      // Building nodes
  way["building"](bbox);       // Building ways (closed polygons)
  relation["building"](bbox);  // Building relations (complex multipart)
  way["highway"](bbox);        // Road network
  way["railway"](bbox);        // Railway network
  way["natural"="water"](bbox);  // Water bodies
  way["landuse"](bbox);        // Land use areas
  ... [9 feature types total]
);
out;>;
out qt;
```

**Response:** OverpassJSON containing nodes, ways, and relations for all matching features

### Caching Layers

The system implements **three-tier caching**:

1. **In-memory cache** (RAM)
   - Fastest access during gameplay
   - Stores parsed ContextDataTile objects
   - Automatically cleared when tiles leave the ring

2. **IndexedDB persistent cache** (browser storage)
   - Survives page reloads and application restarts
   - 24-hour TTL prevents stale data (consistent with elevation cache;
     see [Elevation System](./elevations.md) for comparison)
   - Automatic expiry cleanup on app startup
   - Gracefully falls back to network if expired

3. **Overpass API** (network)
   - Fallback when cache misses occur
   - Includes **exponential backoff retry** (3 attempts)
   - Special handling for rate-limit responses (429)

**Cache Hierarchy Example:**
```
Load tile 15:16384:10741
  ↓ (miss)
Check IndexedDB persistence cache
  ↓ (miss or expired)
Fetch from Overpass API with retries
  ↓ (success)
Store in IndexedDB (24-hour TTL)
Store in memory cache
  ↓
Return parsed ContextDataTile
```

## Feature Categories & Specifications

Nine categories of contextual features are fetched and visualized:

### 1. Buildings

**Visual representation:** 3D polygonal extrusions + canvas texture

**OSM Tags Extracted:**
- `building` (required): Category (residential, commercial, office, church, etc.)
- `height`: Height in meters (e.g., "10.5")
- `building:levels`: Number of floors
- `min_height` / `building:min_level`: Base elevation for stacked buildings
- `roof:shape`: flat, gabled, hipped, pyramidal, dome, cone, onion, skillion
- `roof:material` / `roof:colour`: Color override
- `building:material` / `building:colour`: Wall color override

**Rendering:**
- Canvas: Filled polygon on terrain texture
- Mesh: 3D extrusion with calculated height (OSM tag → default height → 6m fallback)
- Roof generation: Strategy pattern for 7 roof shapes

**Height Estimation (fallback chain):**
```
height tag → building:levels × 3.5m → type default → 6 meters (residential)
```

**Example Heights by Type** (from `src/config.ts`):
| Type | Default Height | Type | Default Height |
|------|----------------|------|----------------|
| house | 6m | office | 15m |
| residential | 6m | cathedral | 20m |
| apartments | 12m | hospital | 10m |
| commercial | 6m | school | 6m |
| industrial | 9m | warehouse | 8m |

**Example Colors** (aerial view palette):
| Type | Wall Color | Type | Wall Color |
|------|-----------|------|-----------|
| residential | #d4cdc0 | industrial | #a8a898 |
| commercial | #c8c0b8 | apartments | #c8c4b8 |
| office | #b8c4cc | warehouse | #a8a090 |

### 2. Roads

**Visual representation:** LineString paths on canvas texture

**OSM Tags Extracted:**
- `highway` (required): Road type (motorway, primary, residential, footway, etc.)
- `lanes`: Number of lanes
- `surface`: Material (asphalt, concrete, gravel, dirt, grass, etc.)
- `tree_lined`: Whether roads have trees
- `bridge` / `layer`: Elevation hints for drawing order

**Rendering:**
- Canvas: Colored lines with width proportional to road type
- Real-world widths: Motorway 25m, trunk 20m, residential 7m, footway 2m

**Width & Color Mapping** (from `src/config.ts`):

| Road Type | Width | Color | Type | Width | Color |
|-----------|-------|-------|------|-------|-------|
| motorway | 25m | #777060 | residential | 7m | #777060 |
| trunk | 20m | #777060 | footway | 2m | #ccccbb |
| primary | 15m | #777060 | cycleway | 2m | #ccccbb |
| secondary | 12m | #777060 | track | 3m | #c4a882 |
| tertiary | 8m | #777060 | bridleway | 3m | #c8b870 |

**Surface Color Overrides:**
- asphalt → #777060 (gray)
- concrete → #ccccbb (light paving)
- gravel / fine_gravel → #c4a882 (tan)
- grass → #90b860 (green)
- sand → #e8d89a (tan/beach)

### 3. Railways

**Visual representation:** LineString paths on canvas with dashed pattern

**OSM Tags Extracted:**
- `railway` (required): Type (rail, light_rail, tram, metro, monorail, etc.)
- `tracks`: Number of parallel tracks
- `bridge` / `layer`: Elevation information

**Rendering:**
- Canvas: Dashed gray lines representing track centers
- Dash patterns: rail [5,3], tram [4,3], disused [2,4]

**Width & Dash Mapping** (from `src/config.ts`):

| Railway Type | Width | Dash Pattern | Color |
|--------------|-------|--------------|-------|
| rail | 4m | [5, 3] | #888888 |
| light_rail | 3m | [4, 3] | #888888 |
| tram | 2m | [4, 3] | #888888 |
| metro | 4m | [4, 3] | #888888 |
| monorail | 3m | [4, 3] | #999999 |
| disused | 2m | [2, 4] | #aaaaaa |

### 4. Water

**Visual representation:** LineString paths OR Polygon areas on canvas

**OSM Tags Extracted:**
- `waterway` (for lines): river, canal, stream, stream, ditch, drain
- `natural` (for areas): water, wetland, coastline
- `water` tags: lake, pond, reservoir

**Rendering:**
- Canvas: Blue-tinted areas for water bodies; blue lines for waterways
- Isarea flag: Distinguishes water bodies (polygons) from waterways (lines)

**Width Mapping for Waterways** (from `src/config.ts`):

| Type | Width | Type | Width |
|------|-------|------|-------|
| river | 20m | stream | 5m |
| canal | 15m | weir | 5m |
| tidal_channel | 10m | ditch | 2m |
| dam | 10m | drain | 2m |

### 5. Vegetation

**Visual representation:** Polygon/Point areas + dense 3D meshes

**OSM Tags Extracted:**
- `natural`: forest, wood, scrub, grass, tree, tree_row, heath, fell, tundra
- `landuse` combinations: treated as vegetation if applicable
- `leaf_type`: broadleaved or needleleaved (3D canopy shape)
- `leaf_cycle`: evergreen or deciduous (3D color range)
- `diameter_crown`: crown diameter in meters
- `circumference`: trunk circumference in meters

**Rendering:**
- Canvas: Green-tinted areas for forest/vegetation backgrounds
- Mesh: Dense tree/crown/shrub generation for forests, orchards, vineyards

**Height & Density Config** (from `src/config.ts`):

| Type | Density | Trunk Height | Crown Radius |
|------|---------|--------------|--------------|
| forest | 1.0/100 m² | 8-15m | 2-5m |
| scrub | 4.0/100 m² | 0m | 1-2.5m |
| orchard | spacing 5×4m | 3-6m | 1.5-2.5m |
| vineyard | spacing 2×1m | 0m | 0.4-0.8m |
| treeRow | 8m interval | 6-12m | 1.5-3m |

### 6. Landuse

**Visual representation:** Polygon areas as canvas background color

**OSM Tags Extracted:**
- `landuse`: farmland, meadow, park, residential, commercial, industrial, military, construction, etc.
- `leisure`: park, garden (treated as landuse)

**Rendering:**
- Canvas: Filled polygon with landuse-specific color as ground texture
- Lowest rendering priority: drawn before roads, water, vegetation

**Landuse Color Mapping** (from `src/config.ts`):

| Type | Color | Type | Color |
|------|-------|------|-------|
| grassland / meadow / park | #90b860 | farmland | #c0cc70 |
| residential / commercial | #d8d4cc | industrial | #d8d4cc |
| construction | #c0aa88 | cemetery | #b0c8a8 |
| sand / beach | #e8d89a | glacier | #e8f0ff |
| bare_rock | #b8a888 | allotments | #88aa50 |

### 7. Aeroways

**Visual representation:** Polygon/LineString areas on canvas texture

**OSM Tags Extracted:**
- `aeroway`: aerodrome (airport), runway, taxiway, taxilane, apron, helipad

**Rendering:**
- Canvas: Colored areas for runways, taxiways, helipads

**Aeroway Color Mapping** (from `src/config.ts`):

| Type | Color | Description |
|------|-------|-------------|
| aerodrome | #d8d4c0 | Airport ground |
| runway | #888880 | Dark gray (main landing area) |
| taxiway | #999990 | Medium gray (aircraft path) |
| taxilane | #999990 | Medium gray (narrow path) |
| apron | #aaaaaa | Light gray (parking area) |
| helipad | #ccccaa | Tan (helicopter landing) |

### 8. Structures (Man-Made)

**Visual representation:** 3D meshes (cylinders, boxes, tapered cylinders)

**OSM Tags Extracted:**
- `man_made`: tower, chimney, mast, water_tower, silo, storage_tank, lighthouse, crane
- `power`: tower, pole (separate category from man_made)
- `aerialway`: pylon

**Rendering:**
- Mesh: 3D extrusions (cylinders, tapered cylinders, boxes, custom shapes)
- Shape, height, radius configurable per type

**Structure Defaults** (from `src/config.ts`):

| Type | Shape | Height | Radius | Color |
|------|-------|--------|--------|-------|
| tower | cylinder | 20m | 3m | #a0a098 |
| chimney | tapered_cylinder | 40m | 2m | #888880 |
| mast | tapered_cylinder | 30m | 1m | #b0b0b0 |
| water_tower | water_tower | 20m | 5m | #a8a8b0 |
| silo | cylinder | 15m | 4m | #d0c8b0 |
| storage_tank | cylinder | 10m | 8m | #c0c0c0 |
| power_tower | box | 25m | 1.5m | #c0c0c8 |
| power_pole | cylinder | 10m | 0.2m | #a08060 |
| lighthouse | tapered_cylinder | 25m | 3m | #f0f0e8 |

### 9. Barriers

**Visual representation:** LineString paths as 3D extruded walls/hedges

**OSM Tags Extracted:**
- `barrier`: wall, city_wall, retaining_wall, hedge
- `material`: brick, concrete, stone, wood, metal (color override)
- `height`: explicit height in meters

**Rendering:**
- Mesh: 3D rectangular extrusions along LineString path
- Width proportional to barrier type
- Height from tag or type default

**Barrier Defaults** (from `src/config.ts`):

| Type | Width | Height | Color |
|------|-------|--------|-------|
| wall | 0.3m | 2m | #c0b8b0 |
| city_wall | 2m | 6m | #c8c0b0 |
| retaining_wall | 0.5m | 1.5m | #a8a098 |
| hedge | 1m | 1.5m | #4a7030 |

**Material Color Overrides** (shared with buildings):
- brick → #c87060
- concrete → #c8c4b8
- stone → #b8b0a0
- wood → #c8a878
- metal → #888888

## Technical Specification

### File Format: OverpassJSON

OverpassJSON is a GeoJSON-compatible format returned by Overpass API containing nodes, ways, and relations.

**Structure:**

```json
{
  "version": 0.6,
  "generator": "Overpass API",
  "elements": [
    {
      "type": "node",
      "id": 12345,
      "lat": 48.8530,
      "lon": 2.3499,
      "tags": { "building": "residential", "height": "10" }
    },
    {
      "type": "way",
      "id": 67890,
      "nodes": [12345, 12346, 12347, 12345],  // Closed ring for polygon
      "tags": { "building": "residential" },
      "geometry": [
        { "lat": 48.8530, "lon": 2.3499 },
        { "lat": 48.8531, "lon": 2.3500 },
        { "lat": 48.8532, "lon": 2.3499 },
        { "lat": 48.8530, "lon": 2.3499 }
      ]
    },
    {
      "type": "relation",
      "id": 11111,
      "members": [
        { "type": "way", "ref": 67890, "role": "outer" },
        { "type": "way", "ref": 67891, "role": "inner" }
      ],
      "tags": { "building": "residential" }
    }
  ]
}
```

### Geometry Types

**Point** - Single lat/lng location
- Used for: point features (tree, tower, utility pole)
- Example: `{ "type": "Point", "coordinates": [x, y] }`

**LineString** - Ordered sequence of coordinates
- Used for: roads, railways, waterways, barriers
- Example: `{ "type": "LineString", "coordinates": [[x1, y1], [x2, y2], [x3, y3]] }`

**Polygon** - One or more rings (outer ring + optional holes)
- Used for: buildings, water bodies, landuse areas, vegetation patches
- First ring = outer boundary; subsequent rings = holes
- Example: `{ "type": "Polygon", "coordinates": [[[x1, y1], [x2, y2], [x3, y3], [x1, y1]]] }`

### Coordinate System

All coordinates are in **Mercator meters**, matching the elevation system:
- **X** increases eastward
- **Y** increases northward
- Conversion from lat/lng: handled by `ContextDataTileLoader.mercatorToLatLng()`

### Tile Dimensions

- **Size:** 256×256 pixels per tile in Web Mercator grid
- **Coverage at zoom 15:** Approximately 2.1 km × 2.1 km per tile
- **Precision:** Sub-meter accuracy (coordinate precision matches elevation system)

### Feature Classification

The **strategy pattern** is used to classify OSM tags into visual features:

```
OSM Element (node/way/relation with tags)
       ↓
ContextDataTileParser
       ↓
Strategy function (classifyBuilding, classifyRoad, etc.)
       ↓
VisualFeature (BuildingVisual, RoadVisual, etc.)
```

**Strategies** in `src/data/contextual/strategies/`:
- `buildingStrategy.ts` - Classify buildings; extract height, roof, material
- `roadStrategy.ts` - Classify roads; calculate width, apply surface color
- `railwayStrategy.ts` - Classify railways; extract track count, dash pattern
- `waterStrategy.ts` - Classify water; distinguish areas vs. lines
- `vegetationStrategy.ts` - Classify vegetation; extract height, leaf type
- `landuseStrategy.ts` - Classify landuse areas; apply colors
- `aerowayStrategy.ts` - Classify aeroways; identify runway types
- `structureStrategy.ts` - Classify structures; assign 3D shapes and sizes
- `barrierStrategy.ts` - Classify barriers; extract material, height

**Tag Matching Priority:**
Most strategies follow this order:
1. Check for explicit tags (e.g., `height`, `building:levels`)
2. Check for material/type overrides (e.g., `building:material`)
3. Use type defaults (e.g., residential building → 6m)
4. Use fallback defaults (e.g., 6m for unknown types)

## Spatial Organization

### Web Mercator Projection

The system uses the same **Web Mercator projection** as the elevation system:

```
Tile Grid at Zoom 15:
├─ X ranges 0 to 2^15 - 1 = 32,767 (west to east)
├─ Y ranges 0 to 2^15 - 1 = 32,767 (north to south)
└─ Each tile covers ~2.1 km × 2.1 km

Mercator Bounds Calculation:
├─ TileX 16384 at zoom 15 covers:
│  └─ minX to maxX (east-west extent)
└─ TileY 10741 at zoom 15 covers:
   └─ minY to maxY (north-south extent)
```

**Tile Key Format:** `z:x:y` (e.g., `15:16384:10741`)
- `z` = zoom level (15)
- `x` = column (west to east, 0 = far west)
- `y` = row (north to south, 0 = far north)

### Ring-Based Tile Loading

The context data system uses the same ring-based loading pattern as elevation data:

- **Ring radius** determines grid size (1 = 3×3 grid, 2 = 5×5 grid, etc.)
- **Tile key format:** `z:x:y` — e.g., `15:16384:10741`
  - `z` = zoom level (15)
  - `x` = column index (west to east; 0 = far west)
  - `y` = row index (north to south; 0 = far north)

**Tile Update Events:**
```
Drone crosses tile boundary
      ↓
setLocation() called (from animation loop)
      ↓
updateTileRing() calculates desired tiles
      ↓
Load new tiles at ring edges
      ↓
Unload tiles outside ring
      ↓
emit tileAdded / tileRemoved events
```

For detailed ring patterns, lifecycle phases, and spatial organization, see [`doc/tile-ring-system.md`](../tile-ring-system.md).

### Tile Boundary Handling

Features crossing tile boundaries are handled naturally:
- **Features within bounds:** Fully rendered
- **Features crossing edges:** Partially rendered (clipped to tile area)
- **Shared features:** May appear in multiple tiles if spanning boundaries

This is acceptable for gameplay since:
- Ring ensures adjacent tiles load together
- Visual discontinuity minimal at tile boundaries
- Performance benefit outweighs minor rendering artifacts

## Interpretation & Rendering

### Parsing Pipeline

```
OverpassJSON
      ↓
ContextDataTileParser.parseOSMData()
      ↓
Build node map (id → lat/lng)
Build way map (id → coordinates)
      ↓
Iterate elements:
├─ Nodes → classify point features (trees, towers, etc.)
├─ Ways → classify linear/polygon features (roads, buildings, etc.)
└─ Relations → classify complex features (multipart buildings, etc.)
      ↓
Strategy pattern: classifyBuilding(), classifyRoad(), etc.
      ↓
Populated ContextDataTile.features object
```

### Strategy Pattern for Classification

Each feature type has a dedicated classifier function:

```typescript
// Example: Building classification
export function classifyBuilding(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  // Extract visual properties from tags
  const height = tags.height ? parseFloat(tags.height) : undefined;
  const buildingType = tags.building || 'other';
  const color = getColorForBuilding(tags, buildingType);

  // Create BuildingVisual with all rendering properties
  const building: BuildingVisual = {
    id,
    geometry,
    type: buildingType,
    height,
    color,
    roofShape: tags['roof:shape'],
    // ... additional properties
  };

  features.buildings.push(building);
}
```

### Canvas Rendering

2D features (roads, water, vegetation, landuse) are rendered to an **OffscreenCanvas** for performance:

```
Feature → Canvas Draw Call
├─ Roads: strokeStyle, lineWidth, quadraticCurveTo()
├─ Water: fillStyle, fill()
├─ Vegetation: fillStyle, fill()
├─ Landuse: fillStyle, fill()
└─ Railways: strokeStyle, setLineDash(), stroke()

Canvas → Three.js Texture → Applied to terrain mesh
```

**Benefits:**
- Single textured mesh per tile (fast rendering)
- Decouples feature rendering from 3D geometry
- Graceful degradation if generation fails

### 3D Mesh Generation

3D features (buildings, vegetation, structures, barriers) create geometric mesh objects:

**Buildings:**
```
Polygon ↓ → Extrude to height ↓ → Generate roof ↓ → Create mesh with wall + roof colors
```

**Vegetation:**
```
Polygon ↓ → Calculate tree density ↓ → Generate random trunk + crown positions
           → Create cone/sphere meshes for each tree/bush
```

**Structures:**
```
Point ↓ → Look up shape (cylinder, box, tapered) ↓ → Generate 3D geometry
        → Apply color and height
```

**Barriers:**
```
LineString ↓ → Extrude along path ↓ → Create rectangular wall mesh
              → Apply width and height
```

All meshes are added to the Three.js scene via `MeshObjectManager`.

### Height Estimation

**Buildings:** Tag → Default
```typescript
// Extract height in this order of precedence:
const height = tags.height // Exact height in meters
           || (tags['building:levels'] * 3.5) // Levels → height estimate
           || buildingHeightDefaults[buildingType] // Type default (6m residential, 15m office)
           || 6; // Fallback: 6 meters
```

**Vegetation:** Config-based
```
Forest: trunk 8-15m, crown radius 2-5m
Scrub: trunk 0m, crown radius 1-2.5m
Orchard: trunk 3-6m, crown radius 1.5-2.5m (grid-based spacing)
Tree: explicit diameter_crown tag in meters
```

### Graceful Degradation

The system handles missing data and cache failures:

**When cache unavailable:**
- Skip tile rendering (no error)
- Terrain remains visible with default color
- User continues exploration unaffected

**When API fails:**
- Exponential backoff retry (100ms, 200ms, 400ms)
- Rate-limit responses (429) skip retry
- Return null, terrain renders with no overlay

**When geometry missing:**
- Use fallback defaults (height, color, width)
- Skip 3D mesh generation if insufficient data
- Canvas texture still renders what it can

## Integration with Drone System

### Event-Driven Architecture

```
Drone moves (from input/physics)
      ↓
Animation frame: drone.applyMove(deltaTime)
      ↓
Drone emits 'locationChanged' event
      ↓
ContextDataManager.setLocation() receives event
      ↓
Check if crossed tile boundary
      ↓ (yes)
updateTileRing() loads/unloads tiles
      ↓
emit tileAdded / tileRemoved
      ↓
TerrainTextureObjectManager listens → creates canvas texture
MeshObjectManager listens → creates 3D meshes
```

### Animation Frame Order

Context data loading integrates into the standard animation frame sequence. See [Animation Loop Architecture](../animation-loop.md) for the complete frame timing and detailed step-by-step breakdown.

In the full sequence, context data is loaded in **step 3**, which must complete before terrain mesh creation (step 4) and feature mesh creation (step 6) so that contextual features have data available for rendering.

### Coordinate Consistency

The contextual data system uses identical **Mercator → Three.js** conversion as elevation:

```
ContextDataTile.features[i].geometry.coordinates = [mercatorX, mercatorY]
Canvas texture applied to terrain mesh at position (mercatorX, mercatorY)

Three.js position:
  x = mercatorX
  y = elevation
  z = -mercatorY  (negated)
```

This ensures buildings, roads, and terrain align perfectly in 3D space.

**See `doc/coordinate-system.md` for full coordinate transformation details.**

### Visualization Integration

**TerrainTextureObjectManager** (in `src/visualization/terrain/texture/`):
```
Listens to contextData.tileAdded
       ↓
Creates TerrainTextureFactory instance
       ↓
Generates 2048×2048 canvas for tile
       ↓
Draws roads, water, vegetation, landuse, aeroways
       ↓
Converts canvas to Three.js Texture
       ↓
Applies to terrain mesh via texture coordinate mapping
```

**MeshObjectManager** (in `src/visualization/mesh/`):
```
Listens to contextData.tileAdded
       ↓
For each feature type (buildings, structures, barriers, vegetation):
├─ Extract geometry and visual properties
├─ Generate Three.js mesh (BufferGeometry + Material)
└─ Add to scene
       ↓
On tileRemoved:
├─ Dispose mesh geometry
├─ Remove from scene
└─ Free memory
```

## Performance & Caching

### Network Efficiency

**Concurrency Control:**
- Max 3 concurrent Overpass API requests
- Prevents server overload and respects rate limits
- Queue mechanism for additional tiles

**Query Optimization:**
- Single OverpassQL query per tile (9 feature types)
- Bounding box filtering (tile-scoped)
- Reduces redundant downloads

**Request Sizes:**
- Typical tile response: 200-500 KB (depends on area density)
- Zoom 15 limits requests to reasonable areas
- Exponential backoff handles slow servers

### Memory Management

**In-Memory Cache:**
- Stores parsed ContextDataTile objects
- Automatic eviction when tiles leave ring
- Max size: 9 tiles × ~200-500 KB = ~2-4.5 MB

**IndexedDB Persistence:**
- Stores entire ContextDataTile objects
- 24-hour TTL prevents stale data
- Automatic cleanup of expired entries
- Typical size: ~50 MB for common areas

**Mesh Objects:**
- Three.js geometries freed on tileRemoved
- Texture memory released when texture removed
- Scene cleanup prevents memory leaks

### Caching Strategy

**24-Hour TTL:**
- Balances freshness (OSM changes infrequently) with network efficiency
- Long enough to survive offline scenarios
- Short enough for reasonable data freshness

**Graceful Degradation:**
- IndexedDB unavailable → skip persistence, use memory only
- API failure → use expired cached data if available
- Both fail → render with empty feature sets

**Async Initialization:**
- Persistence cache initializes separately from data loading
- Non-blocking; app starts without waiting for IndexedDB
- Expired tile cleanup happens on startup

## Key Files & References

### Core System

| File | Purpose |
|------|---------|
| `src/data/contextual/ContextDataManager.ts` | Orchestrates tile loading, caching, ring management; emits tile events |
| `src/data/contextual/ContextDataTileLoader.ts` | Fetches tiles from Overpass API; handles retry/timeout logic |
| `src/data/contextual/ContextDataTileParser.ts` | Parses OverpassJSON; delegates to strategy functions |
| `src/data/contextual/ContextTilePersistenceCache.ts` | IndexedDB-based tile caching (24-hour TTL) |
| `src/data/contextual/types.ts` | TypeScript interfaces for all feature types and data structures |

### Feature Classification Strategies

| File | Feature Type |
|------|--------------|
| `src/data/contextual/strategies/buildingStrategy.ts` | Buildings (residential, commercial, offices, etc.) |
| `src/data/contextual/strategies/roadStrategy.ts` | Roads and paths (highways, residential streets, footways) |
| `src/data/contextual/strategies/railwayStrategy.ts` | Railways and trams |
| `src/data/contextual/strategies/waterStrategy.ts` | Water bodies and waterways (rivers, lakes, canals) |
| `src/data/contextual/strategies/vegetationStrategy.ts` | Forests, scrub, trees, vegetation patches |
| `src/data/contextual/strategies/landuseStrategy.ts` | Landuse areas (parks, farmland, residential, industrial) |
| `src/data/contextual/strategies/aerowayStrategy.ts` | Aeroways (runways, taxiways, helipads) |
| `src/data/contextual/strategies/structureStrategy.ts` | Man-made structures (towers, chimneys, poles) |
| `src/data/contextual/strategies/barrierStrategy.ts` | Barriers (walls, hedges, retaining walls) |
| `src/data/contextual/strategies/parserUtils.ts` | Shared utilities: coordinate conversion, geometry parsing |

### Visualization Integration

| File | Purpose |
|------|---------|
| `src/visualization/terrain/texture/TerrainTextureObjectManager.ts` | Manages canvas texture generation and application to terrain |
| `src/visualization/terrain/texture/TerrainTextureFactory.ts` | Canvas rendering: roads, water, vegetation, landuse, aeroways |
| `src/visualization/mesh/MeshObjectManager.ts` | Manages 3D mesh objects for buildings, vegetation, structures, barriers |

### Configuration

| File | Lines | Purpose |
|------|-------|---------|
| `src/config.ts` | 84-99 | contextDataConfig: zoom, ring radius, concurrency, timeout, endpoint |
| `src/config.ts` | 104-158 | colorPalette, buildingHeightDefaults, material colors, roof colors |
| `src/config.ts` | 189-290 | structureDefaults, barrierDefaults, vegetationMeshConfig |
| `src/config.ts` | 295-348 | groundColors: landuse and water colors |
| `src/config.ts` | 353-429 | roadSpec, surfaceColors, railwaySpec, waterwayWidthsMeters |

### Testing

- `src/data/contextual/ContextDataManager.test.ts` - Tile loading, ring management, caching
- `src/data/contextual/ContextDataTileParser.test.ts` - OSM parsing and feature classification
- `src/data/contextual/ContextTilePersistenceCache.test.ts` - IndexedDB cache behavior

## Glossary

**Aeroway** - OSM feature for airport infrastructure (runways, taxiways, helipads)

**Bounding Box (bbox)** - Rectangle defined by min/max latitude and longitude; used to scope Overpass queries to tile area

**Feature Classification** - Process of examining OSM tags and determining which visual type (BuildingVisual, RoadVisual, etc.) to create

**Graceful Degradation** - System remains functional when cache/network fails; terrain renders without feature overlays

**IndexedDB** - Browser's persistent key-value storage (survives page reload); used for 24-hour tile cache

**Landuse** - OSM classification of ground area (farmland, park, residential, industrial, etc.)

**Mercator Projection** - Web mapping standard used for tile coordinates and spatial queries (EPSG:3857)

**Natural** - OSM tag for natural features (forests, water, grassland); combines with landuse

**Overpass API** - Free, open-source query service for OpenStreetMap data; returns OverpassJSON

**OverpassJSON** - JSON format for Overpass API responses; contains nodes, ways, relations with tags and geometry

**OverpassQL** - Query language for Overpass API; supports complex spatial and tag-based queries

**Ring** - Circular pattern of tiles loaded around drone (3×3 grid at radius=1)

**Strategy Pattern** - Design pattern using separate functions (classifyBuilding, classifyRoad, etc.) for feature classification

**Tag** - OSM key-value pair describing feature properties (building=residential, height=10, etc.)

**Terrarium** - AWS elevation tile service used for elevation data (distinct from this contextual data system)

**Tile** - Rectangular region in Web Mercator grid (256×256 pixels); identified by z:x:y coordinates

**TTL (Time-To-Live)** - Expiry duration for cached data (24 hours for context tiles)

**Way** - OSM feature representing linestring or polygon (roads, buildings, water, etc.)

**Zoom Level** - Web Mercator scale (15 = ~2.1 km/tile); higher = more detail, more requests
