# Data Pipeline Pattern

## Overview

The drone simulator uses a consistent **four-stage pipeline pattern** for all data systems. This pattern decouples data retrieval, parsing, and visualization, making the system scalable, testable, and maintainable.

The pattern applies to:
- **Elevation data** (AWS Terrarium PNG tiles → 3D geometry)
- **Contextual data** (OpenStreetMap features → canvas texture + 3D objects)
- **Terrain texture** (OSM features → 2048×2048 canvas)
- **3D objects** (OSM features → buildings, trees, structures)

## The Four-Stage Pattern

```
Source Data
     ↓
Manager (Ring-based loading, caching, lifecycle)
     ↓
Parser (Decode format, extract features, classify)
     ↓
Factory (Convert to 3D geometry, create Three.js objects)
     ↓
Three.js Scene (Add objects, manage lifecycle)
```

### Stage 1: Manager

**Role**: Orchestrate data loading and lifecycle management

**Responsibilities**:
- **Ring-based loading**: Maintain a tile ring around the drone's position
- **Tile caching**: Keep frequently-accessed tiles in memory and IndexedDB persistent cache
- **Concurrency control**: Limit simultaneous network requests (typically 3)
- **Event emission**: Signal when tiles are added/removed
- **Resource cleanup**: Dispose of tiles and abort pending requests on shutdown

**Key Files**:
- `ElevationDataManager.ts` — Manages elevation tile loading and caching
- `ContextDataManager.ts` — Manages OSM feature tile loading and caching
- `MeshObjectManager.ts` — Manages 3D object lifecycle
- `TerrainTextureObjectManager.ts` — Manages texture object lifecycle

**Configuration Pattern** (in `src/config.ts`):
```typescript
dataConfig = {
  zoomLevel: 15,                  // Web Mercator zoom (affects tile resolution)
  ringRadius: 1,                  // Tile ring size (1 = 3×3 grid, 9 tiles total)
  maxConcurrentLoads: 3,          // Network concurrency limit
  // ... service-specific settings
}
```

**Ring-Based Loading** benefits:
- Constant memory usage (fixed number of tiles)
- Minimal network requests (tiles only load near drone)
- Graceful degradation (cache fallback when network unavailable)

### Stage 2: Parser

**Role**: Extract and decode raw data into standardized format

**Responsibilities**:
- **Format decoding**: Parse binary or text data (PNG, GeoJSON, etc.)
- **Feature extraction**: Identify geographic features and attributes
- **Data classification**: Categorize features by type
- **Validation**: Check data integrity and completeness
- **Transformation**: Normalize data for consistent downstream handling

**Key Files**:
- `ElevationDataTileParser.ts` — Decodes Terrarium RGB formula from PNG pixels
- `ContextDataTileParser.ts` — Parses GeoJSON and classifies OSM features
- `TerrainCanvasRenderer.ts` — Renders OSM features to canvas texture
- Feature-specific parsers (e.g., building attributes, tree species)

**Example: Elevation Data**
```
PNG Image (256×256 pixels, RGBA format)
     ↓
Read pixel RGB values
     ↓
Apply Terrarium formula: (R × 256 + G + B/256) - 32768
     ↓
Elevation grid [256×256] in meters
```

**Example: Contextual Data**
```
OverpassJSON response (GeoJSON variant)
     ↓
Extract features by type (building, highway, natural, etc.)
     ↓
Classify features into categories (buildings, roads, water, etc.)
     ↓
Normalize attributes (heights, colors, materials, etc.)
     ↓
Feature objects with standardized properties
```

### Stage 3: Factory

**Role**: Create Three.js objects (geometry, meshes, materials)

**Responsibilities**:
- **Geometry creation**: Generate Three.js BufferGeometry from parsed data
- **Material application**: Assign colors, textures, lighting properties
- **Spatial transformation**: Position objects in Mercator coordinates
- **Mesh grouping**: Combine related geometry into hierarchical objects
- **Optimization**: Use InstancedMesh, LOD, or baking where appropriate

**Key Files**:
- `TerrainGeometryFactory.ts` — Creates Three.js geometry from elevation grids
- `TerrainObjectFactory.ts` — Creates textured terrain meshes
- `BuildingMeshFactory.ts` — Creates 3D building geometry with roofs
- `TreeMeshFactory.ts` — Creates tree meshes with InstancedMesh optimization
- `RailwayMeshFactory.ts`, `BarrierMeshFactory.ts` — Specialized geometry

**Example: Elevation Geometry**
```
Elevation grid [256×256] values
     ↓
Generate vertex positions (one per grid point)
     ↓
Compute triangle indices (two per grid square)
     ↓
Calculate vertex normals (for lighting)
     ↓
Create Three.js BufferGeometry
     ↓
Assign MeshPhongMaterial with texture UV mapping
```

**Example: Building Mesh**
```
OSM building polygon + attributes
     ↓
Extract wall height (from tags or defaults)
     ↓
Create ExtrudeGeometry (2D footprint → 3D walls)
     ↓
Generate roof geometry (based on roof:shape attribute)
     ↓
Apply wall and roof colors
     ↓
Position at Mercator coordinates + elevation
     ↓
Create Mesh or Group (for multi-part roofs)
```

### Stage 4: Visualization

**Role**: Manage Three.js objects in the scene

**Responsibilities**:
- **Scene management**: Add/remove meshes from Three.js scene
- **Object hierarchy**: Organize objects in spatial groups if needed
- **Lifecycle coordination**: Ensure geometry and texture availability before rendering
- **Performance**: Handle LOD transitions or instancing
- **Cleanup**: Dispose of resources on tile unload

**Key Pattern: TerrainObjectManager**

The elevation + texture pipeline illustrates the coordination pattern:

```
Drone Position Update
        ↓
ElevationDataManager              ContextDataManager
        ↓                                 ↓
TerrainGeometryObjectManager      TerrainTextureObjectManager
        ↓                                 ↓
[Emit geometryAdded event]        [Emit textureAdded event]
        │                                │
        └─────→ TerrainObjectManager ←───┘
                        ↓
                [Both available?]
                        ↓
                TerrainObjectFactory
                        ↓
        Create mesh (geometry + texture)
                        ↓
        Add to Three.js Scene
```

**Coordination Logic**:
- Listen to **geometryAdded** and **textureAdded** events
- Create mesh only when BOTH geometry and texture are ready
- Maintain separate maps of loaded geometry and textures
- Remove meshes when either geometry or texture unloads

## System-Specific Applications

| System | Source | Manager | Parser | Factory | Scene |
|--------|--------|---------|--------|---------|-------|
| **Elevation** | AWS Terrarium PNG | ElevationDataManager | ElevationDataTileParser | TerrainGeometryFactory | Terrain mesh |
| **Contextual** | OpenStreetMap (Overpass) | ContextDataManager | ContextDataTileParser | Canvas → Texture | Textured terrain |
| **Objects** | OSM features (GeoJSON) | ContextDataManager | ContextDataTileParser | BuildingMeshFactory, TreeMeshFactory, etc. | 3D buildings, trees |
| **Texture** | OSM features (canvas render) | ContextDataManager | ContextDataTileParser + TerrainCanvasRenderer | Canvas texture | Applied to mesh UVs |

## Key Benefits

**Separation of Concerns**
- Manager handles async resource lifecycle
- Parser handles data decoding (no Three.js dependencies)
- Factory handles geometry creation (testable in isolation)
- Scene management remains simple (just add/remove meshes)

**Testability**
- Each stage can be tested independently
- Mocks/stubs replace upstream stages during testing
- Parser can be tested without network requests
- Factory can be tested with synthetic parsed data

**Reusability**
- Parser output used by multiple factories (elevation data feeds both geometry and elevation sampler)
- Factory code shared across multiple managers (RoofGeometryFactory used by both BuildingMeshFactory and specialized roof rendering)

**Scalability**
- New data sources fit the pattern with custom Manager + Parser
- New visualization types use existing managers/parsers
- Ring-based loading scales to arbitrary terrain sizes

## Coordinate System Consistency

All stages must use the same coordinate convention:

**Position**: Mercator X → Three.js X, Elevation → Three.js Y, -Mercator Y → Three.js Z

```typescript
// In factories, when positioning objects:
const threeX = mercatorLocation.x;
const threeY = elevation;
const threeZ = -mercatorLocation.y;  // Key: negation for north alignment
```

For full details, see [`doc/coordinate-system.md`](coordinate-system.md).

## Related Documentation

- **Ring-based loading**: See [`doc/tile-ring-system.md`](tile-ring-system.md)
- **Animation loop**: See [`doc/animation-loop.md`](animation-loop.md) for frame-by-frame orchestration
- **Coordinate system**: See [`doc/coordinate-system.md`](coordinate-system.md) for Mercator→Three.js transformation
- **Specific systems**:
  - Elevation data: [`doc/data/elevations.md`](data/elevations.md)
  - Contextual data: [`doc/data/contextual.md`](data/contextual.md)
  - Canvas rendering: [`doc/visualization/canvas-rendering.md`](visualization/canvas-rendering.md)
  - 3D objects: [`doc/visualization/objects.md`](visualization/objects.md)
  - Ground surface: [`doc/visualization/ground-surface.md`](visualization/ground-surface.md)

## See Also

- **[Glossary](./glossary.md)** - Definitions of all technical terms
