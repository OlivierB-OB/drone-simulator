# Contextual Data System

## Overview

The drone simulator uses **OpenStreetMap (OSM)** data fetched via the **Overpass API** to render the environment's features and landmarks. This system provides:

- **Real-world buildings, roads, railways, water** and other structures
- **Efficient tile loading** using Web Mercator projection with z/x/y coordinates at zoom level 15
- **Ring-based caching** around the drone to minimize API requests
- **Dual rendering** - 2D canvas textures on terrain + 3D meshes in the scene
- **Graceful degradation** when cache or API is unavailable

The contextual (OpenStreetMap) system follows the standard **Data Pipeline Pattern**
(see [`doc/data-pipeline.md`](../data-pipeline.md) for detailed explanation).

### Contextual Data Pipeline

```
OpenStreetMap Data (via Overpass API)
       ↓
ContextDataManager (Ring-based loading, caching)
       ↓
ContextDataTileParser (GeoJSON parsing, feature classification)
       ↓
Feature Categories:
  - Buildings, Roads, Waterways, Vegetation, Aeroway, Railways
       ↓
MeshObjectManager (3D buildings, trees, structures)
TerrainTextureObjectManager (Canvas rendering for texture)
       ↓
Textured Terrain + 3D Objects in Scene
```

For the general Manager → Parser → Factory pattern and how it applies across
the system, see the Data Pipeline Pattern documentation.

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

## Feature Categories

Nine categories of contextual features are fetched, parsed, and rendered:

| Feature Type | Canvas (2D) | Mesh (3D) | Key OSM Tags |
|---|---|---|---|
| **Buildings** | Filled polygon | Extruded polygon + roof | `building`, `height`, `building:levels`, `roof:shape` |
| **Roads** | Colored lines (width by type) | — | `highway`, `lanes`, `surface` |
| **Railways** | Dashed gray lines | — | `railway`, `tracks` |
| **Water** | Blue areas / blue lines | — | `waterway`, `natural=water` |
| **Vegetation** | Green areas | Trees, shrubs, crowns | `natural=forest/wood`, `leaf_type`, `leaf_cycle` |
| **Landuse** | Filled background areas | — | `landuse`, `leisure=park` |
| **Aeroways** | Colored areas | — | `aeroway` |
| **Structures** | — | Cylinders, boxes, tapers | `man_made`, `power`, `aerialway=pylon` |
| **Barriers** | — | Extruded walls/hedges | `barrier`, `height`, `material` |

For colors, widths, heights, and detailed rendering specs, see:
- **[Canvas Rendering](../visualization/canvas-rendering.md)** — layer ordering, colors, widths, dash patterns, drawing algorithms
- **[3D Object Visualization](../visualization/objects.md)** — heights, shapes, geometry, materials, roof types

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
- **Coverage at zoom 15:** Approximately 1.22 km × 1.22 km per tile
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

## Graceful Degradation

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

## Integration & Performance

Context data loads when the drone moves, after elevation updates. For tile ring management, caching, and network concurrency, see:
- **[Tile Ring System](../tile-ring-system.md)** — ring lifecycle, caching, eviction, network concurrency
- **[Coordinate System](../coordinate-system.md)** — Mercator → Three.js transforms

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

## See Also

- **[Glossary](../glossary.md)** - Definitions of all technical terms
