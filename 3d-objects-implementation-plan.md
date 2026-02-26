# Plan: 3D Mesh Object Rendering

## Context

The drone simulator has a working ground texture pipeline (canvas 2D) covering landuse, water, roads, railways, vegetation areas, and aeroways. The visual-specifications.md also defines **3D mesh features** that are not yet implemented: buildings, man-made structures, barriers, instanced vegetation, and bridges. This plan covers the full 3D mesh rendering layer.

**What exists today:**
- `ContextDataManager` emits `tileAdded`/`tileRemoved` with parsed `ContextDataTile`
- Buildings are parsed but filtered (only those with `height` or `building:levels`), with placeholder colors (purple/pink)
- Vegetation types `tree`/`tree_row` are parsed but skipped on canvas (reserved for 3D)
- No 3D meshes exist beyond terrain and drone

---

## Architecture Decision

One `MeshObjectManager` listens to `ContextDataManager` events and delegates to per-feature-type factories. This mirrors the existing `TerrainTextureObjectManager` pattern (event-driven, tile-keyed lifecycle, dispose on removal).

```
ContextDataManager tileAdded/tileRemoved
  └─▶ MeshObjectManager
        ├─▶ BuildingMeshFactory
        ├─▶ StructureMeshFactory
        ├─▶ BarrierMeshFactory
        ├─▶ VegetationMeshFactory
        └─▶ BridgeMeshFactory
```

Each factory receives parsed visual data + an `ElevationSampler` and returns `Object3D[]`.

### Directory layout

```
src/visualization/mesh/
  MeshObjectManager.ts
  util/
    ElevationSampler.ts
    PolygonExtruder.ts      -- ExtrudeGeometry helper for building polygons
    PointDistributor.ts     -- grid/line distribution for vegetation
  building/
    BuildingMeshFactory.ts
  structure/
    StructureMeshFactory.ts
  barrier/
    BarrierMeshFactory.ts
  vegetation/
    VegetationMeshFactory.ts
  bridge/
    BridgeMeshFactory.ts
```

---

## Step 1 — Config: add spec constants

**File: `src/config.ts`**

Replace the placeholder `colorPalette.buildings` with spec-accurate values and add new config blocks:

- `buildingHeightDefaults` — height per building type from spec §6.1 (house: 6m, apartments: 12m, office: 15m, etc.)
- `buildingMaterialColors` — wall color per `building:material` from spec §6.1 (brick: `#c87060`, concrete: `#c8c4b8`, etc.)
- `roofMaterialColors` — roof color per `roof:material` from spec §6.1 (roof_tiles: `#b06040`, slate: `#708090`, etc.)
- `structureDefaults` — shape, radius, height, color per `man_made`/`power` type from spec §6.3
- `barrierDefaults` — width, height, color per barrier type from spec §6.4
- `vegetationMeshConfig` — density, sizing for forest/scrub/orchard/vineyard/tree_row from spec §7
- `barrierMaterialColors` — wall color per `material` tag from spec §6.4 (same palette as buildings)

---

## Step 2 — Types: extend visuals for 3D

**File: `src/data/contextual/types.ts`**

### Extend `BuildingVisual`
```ts
export interface BuildingVisual {
  id: string;
  geometry: Polygon | Point | LineString;
  type: string;
  height?: number;
  minHeight?: number;          // NEW — min_height tag
  levelCount?: number;
  minLevelCount?: number;      // NEW — building:min_level
  color: HexColor;             // wall color (derivation changes: building:colour → building:material → default)
  roofColor?: HexColor;        // NEW — roof:colour → roof:material → shape-based default
  roofShape?: string;          // NEW — flat, gabled, hipped, pyramidal, dome, onion, cone, skillion
  roofHeight?: number;         // NEW — roof:height in meters
  roofDirection?: number;      // NEW — degrees
  isPart?: boolean;            // NEW — building:part=yes
  relationId?: string;         // NEW — parent building relation ID (for part grouping)
}
```

### Extend `VegetationVisual`
```ts
export interface VegetationVisual {
  // ... existing fields ...
  leafType?: 'broadleaved' | 'needleleaved';   // NEW — canopy shape
  leafCycle?: 'evergreen' | 'deciduous';        // NEW — canopy color range
  crownDiameter?: number;                       // NEW — diameter_crown tag
  trunkCircumference?: number;                  // NEW — circumference tag
}
```

### Extend `RoadVisual`
```ts
export interface RoadVisual {
  // ... existing fields ...
  treeLined?: 'both' | 'left' | 'right' | 'yes';  // NEW — tree_lined tag
  bridge?: boolean;    // NEW — bridge=yes
  layer?: number;      // NEW — layer tag
}
```

### Extend `RailwayVisual`
```ts
export interface RailwayVisual {
  // ... existing fields ...
  bridge?: boolean;    // NEW
  layer?: number;      // NEW
}
```

### Add `StructureVisual`
```ts
export interface StructureVisual {
  id: string;
  geometry: Point | Polygon;
  type: string;  // tower, chimney, mast, communications_tower, water_tower, silo, storage_tank, lighthouse, crane, power_tower, power_pole, aerialway_pylon
  height?: number;
  diameter?: number;  // storage_tank diameter
  color: HexColor;
}
```

### Add `BarrierVisual`
```ts
export interface BarrierVisual {
  id: string;
  geometry: LineString;
  type: string;  // wall, city_wall, retaining_wall, hedge
  height?: number;
  width: number;     // mesh width in meters
  color: HexColor;
  material?: string; // material tag for wall color override
}
```

### Update `ContextDataTile.features`
Add `structures: StructureVisual[]` and `barriers: BarrierVisual[]`.

---

## Step 3 — Overpass query: fetch new feature types

**File: `src/data/contextual/ContextDataTileLoader.ts`** — `generateOverpassQuery()`

Add selectors:
```
node["man_made"~"tower|chimney|mast|communications_tower|water_tower|silo|storage_tank|lighthouse|crane"](bbox);
way["man_made"~"tower|chimney|mast|communications_tower|water_tower|silo|storage_tank|lighthouse|crane"](bbox);
node["power"~"tower|pole"](bbox);
node["aerialway"="pylon"](bbox);
way["barrier"~"wall|city_wall|retaining_wall|hedge"](bbox);
way["natural"="tree_row"](bbox);
```

Also add `relation["building"="*"]` with building:part query to enable part grouping (currently buildings are already fetched via `relation["building"]`).

---

## Step 4 — Parser: extract 3D attributes

**File: `src/data/contextual/ContextDataTileParser.ts`**

### 4a. Remove building height/level filter
Currently lines 353/560/651 skip buildings without `height` or `building:levels`. Remove this filter — all buildings get rendered using type-based height defaults from config.

### 4b. Extract full building properties
For each building way/relation/node, extract:
- `building:colour` → `color` (priority 1)
- `building:material` → lookup `buildingMaterialColors` → `color` (priority 2)
- Default `#d0ccbc` (priority 3)
- `roof:colour`, `roof:material` → `roofColor` (same priority chain)
- `roof:shape`, `roof:height`, `roof:direction` → new fields
- `min_height`, `building:min_level` → `minHeight`, `minLevelCount`

### 4c. Handle `building:part=yes`
Parse ways/relations with `building:part=yes`. Set `isPart: true`. Track parent relation ID via relation membership so the parent outline can be excluded from extrusion when parts exist.

### 4d. Parse structures
New branch in `processWay`/`processNode`: when `tags['man_made']` matches structure types, or `tags.power` is `tower`/`pole`, or `tags.aerialway` is `pylon`, create `StructureVisual`.

### 4e. Parse barriers
New branch: when `tags.barrier` matches `wall|city_wall|retaining_wall|hedge`, create `BarrierVisual` with width/height/color from config defaults, overridden by `height` tag and `material` tag.

### 4f. Extract vegetation 3D tags
For `natural=tree` nodes: extract `leaf_type`, `leaf_cycle`, `diameter_crown`, `circumference`, `height`.
For `natural=tree_row` ways: same tags + parse as LineString vegetation.
For forest/wood/scrub areas: extract `leaf_type`, `leaf_cycle` from area tags.

### 4g. Extract road bridge/tree_lined
For highways: extract `tree_lined` tag, `bridge` tag, `layer` tag.
For railways: extract `bridge` tag, `layer` tag.

### 4h. Update `features` initialization
Add `structures: []` and `barriers: []` to the features object.

---

## Step 5 — ElevationSampler utility

**File: `src/visualization/mesh/util/ElevationSampler.ts`**

Samples terrain elevation at a Mercator (x, y) coordinate by looking up the correct elevation tile and bilinearly interpolating within its 256×256 grid. Returns 0 if no tile covers the point.

**Requires**: Add a public `getTileAt(mercatorX, mercatorY)` method to `ElevationDataManager` (currently the `tileCache` is private).

**File: `src/data/elevation/ElevationDataManager.ts`** — add:
```ts
getTileAt(mercatorX: number, mercatorY: number): ElevationDataTile | null
```
Uses `ElevationDataTileLoader.getTileCoordinates()` to find the tile key, then looks up `tileCache`.

---

## Step 6 — MeshObjectManager

**File: `src/visualization/mesh/MeshObjectManager.ts`**

Follows the `TerrainTextureObjectManager` pattern:
- Listens to `contextData.on('tileAdded', ...)` and `contextData.on('tileRemoved', ...)`
- On `tileAdded`: calls each factory, collects `Object3D[]`, adds all to scene, stores in `Map<TileKey, Object3D[]>`
- On `tileRemoved`: removes all meshes from scene, disposes geometry+material, deletes from map
- `dispose()`: unsubscribes events, disposes all meshes, clears map

Building part handling: before calling `BuildingMeshFactory`, collect IDs of buildings that have child parts. Pass this set to the factory so it can skip parent outlines.

---

## Step 7 — BuildingMeshFactory

**File: `src/visualization/mesh/building/BuildingMeshFactory.ts`**

For each `BuildingVisual` with Polygon geometry:

1. **Height**: `height` tag → `levelCount * 3.0 + 1.0` → `buildingHeightDefaults[type]` → 6m
2. **minHeight**: `minHeight` tag → `minLevelCount * 3.0` → 0
3. **Extrusion**: Use Three.js `Shape` (outer ring) + `Path` holes (inner rings) + `ExtrudeGeometry` with `depth = height - minHeight`
4. **Positioning**: Compute polygon centroid, build shape in local coords (relative to centroid), position mesh at `(centroidX, terrainElevation + minHeight, -centroidY)`
5. **Wall material**: `MeshLambertMaterial` with wall `color`
6. **Roof**: For flat roofs (initial implementation), the extrusion cap uses `roofColor`. Apply as a second material on the cap faces.
7. **Skip**: buildings with `isPart: false` that have child parts (identified by `relationId` grouping)

### Coordinate precision
Building vertices in local space (relative to centroid) to avoid float32 jitter at large Mercator coordinates — same pattern as `TerrainObjectFactory`.

### Non-flat roofs (future enhancement)
Gabled/hipped/pyramidal roofs require custom geometry on top of the extruded walls. Defer to a follow-up — flat roofs with correct colors cover the common case.

---

## Step 8 — StructureMeshFactory

**File: `src/visualization/mesh/structure/StructureMeshFactory.ts`**

Parametric shapes per type from `structureDefaults` config:
- `cylinder` → `CylinderGeometry(radius, radius, height, segments)`
- `tapered_cylinder` (chimney) → `CylinderGeometry(radius*0.6, radius, height, segments)`
- `box` (power_tower, pylon) → `BoxGeometry(size, height, size)`
- `water_tower` → cylinder body + sphere cap (Group)
- `crane` → vertical box + horizontal arm box (Group)

Position: centroid of geometry, `y = terrainElevation`, `z = -mercatorY`.
Material: `MeshLambertMaterial` with color from config.

---

## Step 9 — BarrierMeshFactory

**File: `src/visualization/mesh/barrier/BarrierMeshFactory.ts`**

For each `BarrierVisual` (LineString):
- Walk segments, create `BoxGeometry(width, height, segmentLength)` per segment
- Rotate each box to align with segment direction
- Position at segment midpoint, `y = terrainElevation`
- Color from `barrierMaterialColors[material]` or type default

For `hedge` type: additionally place bush meshes along the line at ~1m intervals (oblate sphere, color `#3a6828`–`#5a8838`).

---

## Step 10 — VegetationMeshFactory

**File: `src/visualization/mesh/vegetation/VegetationMeshFactory.ts`**

Performance-critical — use `InstancedMesh` for forests/scrub.

### Forest/wood areas (§7.1)
For each forest/wood polygon:
1. Distribute points: grid with random jitter, ~1 per 100m², clipped to polygon
2. Create shared geometries: trunk `CylinderGeometry`, canopy `SphereGeometry` (broadleaved) or `ConeGeometry` (needleleaved)
3. Two `InstancedMesh`es per area: trunk instances + canopy instances
4. Per-instance: random height 8–15m, position from elevation sampler, seeded color variation

### Scrub areas (§7.2)
Same approach, ~1 per 25m², flattened sphere (Y scale ×0.6), no trunk, radius 1–2.5m.

### Orchard rows (§7.3)
Grid aligned to polygon major axis, 5m×4m spacing, shorter trees (3–6m).

### Vineyard rows (§7.4)
Grid 2m×1m spacing, tiny flattened spheres (Y ×0.5, radius 0.4–0.8m).

### Single trees (§7.1 — `natural=tree`, Point)
Individual tree meshes. Use tag-driven dimensions (`height`, `diameter_crown`, `leaf_type`, `circumference`).

### Tree rows (§7.1 — `natural=tree_row`, LineString)
Distribute trees along line at `diameter_crown` or 8m intervals.

### Tree-lined roads (§7.5)
For roads with `treeLined` set: offset road centerline by `widthMeters/2 + 1.5m`, place trees at 8m intervals.

### Seeded randomness
Use deterministic seed from Mercator position hash so trees are stable across tile reloads.

---

## Step 11 — BridgeMeshFactory

**File: `src/visualization/mesh/bridge/BridgeMeshFactory.ts`**

For roads/railways with `bridge === true`:
1. Bridge deck: flat `BoxGeometry(roadWidth + 2m margin, 0.5m thickness, segmentLength)` per segment
2. Color: `#b0a898` (concrete)
3. Layer height: `layer * 5m + terrainElevation`
4. Road/rail segment elevated above deck

---

## Step 12 — Integration

**File: `src/App.tsx`**

After terrain managers, before animation loop:
```ts
const elevationSampler = new ElevationSampler(elevationData);
const meshObjectManager = new MeshObjectManager(
  viewer3D.getScene(),
  contextData,
  elevationSampler
);
```

In cleanup:
```ts
meshObjectManager?.dispose();
```

No animation loop changes needed — mesh objects are static per tile.

---

## Step 13 — Cache version bump

**File: `src/data/contextual/ContextTilePersistenceCache.ts`**

Bump `DB_VERSION` to clear stale tiles that lack the new fields (structures, barriers, extended building properties).

---

## Implementation Order

Each phase is independently shippable:

| Phase | Scope | Key files |
|-------|-------|-----------|
| **A** | Infrastructure: config, types, sampler, Overpass query | `config.ts`, `types.ts`, `ElevationSampler.ts`, `ContextDataTileLoader.ts`, `ElevationDataManager.ts` |
| **B** | Buildings (highest visual impact) | `ContextDataTileParser.ts`, `BuildingMeshFactory.ts`, `MeshObjectManager.ts`, `App.tsx` |
| **C** | Vegetation 3D (instanced trees/bushes) | `VegetationMeshFactory.ts`, parser extensions |
| **D** | Man-made structures | `StructureMeshFactory.ts`, parser extensions |
| **E** | Barriers | `BarrierMeshFactory.ts`, parser extensions |
| **F** | Bridges | `BridgeMeshFactory.ts`, parser extensions |
| **G** | Non-flat roofs (gabled, hipped, dome) | `BuildingMeshFactory.ts` enhancement |

---

## Key Risks

1. **Building polygon triangulation**: Three.js `ExtrudeGeometry` may fail on complex/self-intersecting OSM polygons. Mitigation: wrap in try/catch, skip degenerate buildings.
2. **Elevation timing**: Context tiles may load before elevation tiles. Mitigation: `ElevationSampler` returns 0 as fallback; meshes appear at ground level until elevation loads.
3. **Vegetation performance**: Dense forests at zoom 15 could produce tens of thousands of instances. Mitigation: cap instances per polygon, use `InstancedMesh` (2 draw calls per area).
4. **Float32 precision**: Building coordinates at Mercator scale (~10M). Mitigation: local coordinate space relative to polygon centroid for vertices, world-space position on the mesh.

---

## Verification

1. `bun run type-check` — no TypeScript errors
2. `bun run test` — all existing tests pass + new factory tests
3. `bun run dev` — fly over Paris, verify:
   - Buildings appear as gray/cream 3D blocks at correct heights
   - Rooftops have distinct color from walls
   - Bois de Boulogne shows instanced trees
   - Seine bridges show elevated decks
   - Towers/chimneys visible at correct heights
   - Walls render as extruded lines along their path
