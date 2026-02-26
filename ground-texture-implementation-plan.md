# Plan: Ground Texture Rendering — Match Visual Specifications

## Context

The drone simulator has a working terrain texture pipeline: Overpass API → parser → canvas renderer → Three.js texture. However, the current implementation has placeholder colors, incomplete feature coverage, incorrect draw order, and coarse road/railway widths. The visual-specifications.md defines exactly how ground features should look — realistic aerial colors, per-type widths, proper layering. This plan aligns the ground texture rendering to that spec.

**Scope:** Canvas 2D painting only (rendering mode `ground`). No 3D meshes, no instanced vegetation, no building shadows (buildings will be 3D later).

---

## Step 1: Update types — add `LanduseVisual`, refine existing types

**File: `src/data/contextual/types.ts`**

- Add `LanduseVisual` interface: `{ id, geometry: Polygon, type: string, color: HexColor }`
- `RoadVisual`: replace `widthCategory: 'large'|'medium'|'small'` → `widthPx: number`. Add `surfaceColor?: HexColor`.
- `RailwayVisual`: add `widthPx: number`, `dash: number[]`
- `WaterVisual`: add `widthPx: number` (for waterway lines; 0 for polygon bodies)
- Rename `AirportVisual` → `AerowayVisual` (re-export old name as alias)
- Add `landuse: LanduseVisual[]` to `ContextDataTile.features`

---

## Step 2: Replace color palette with spec-accurate values

**File: `src/config.ts`**

Replace `colorPalette` with structured spec constants:

```
groundColors = {
  default: '#d8c8a8',
  landuse: { grassland:'#90b860', meadow:'#90b860', park:'#90b860', farmland:'#c0cc70',
             orchard:'#98c068', vineyard:'#88a048', allotments:'#88aa50', cemetery:'#b0c8a8',
             construction:'#c0aa88', residential:'#d8d4cc', commercial:'#d8d4cc',
             retail:'#d8d4cc', industrial:'#d8d4cc', military:'#d8d4cc',
             sand:'#e8d89a', beach:'#e8d89a', dune:'#e8d89a', bare_rock:'#b8a888',
             scree:'#c0b090', mud:'#a89870', glacier:'#e8f0ff', recreation_ground:'#90b860',
             plant_nursery:'#88b060' },
  water: { body:'#3a6ab0', line:'#4a7ac0', wetland:'#5a9a6a', dam:'#888880', weir:'#888880' },
  vegetation: { wood:'#3a7a30', forest:'#3a7a30', scrub:'#5a8a40', heath:'#8a7a50',
                fell:'#a0a070', tundra:'#a0a070' },
  aeroways: { aerodrome:'#d8d4c0', runway:'#888880', taxiway:'#999990', taxilane:'#999990',
              apron:'#aaaaaa', helipad:'#ccccaa' }
}
```

Add road spec tables (highway→width, highway→color, surface→color), railway spec table (type→width/dash), waterway spec table (type→width).

---

## Step 3: Expand Overpass query

**File: `src/data/contextual/ContextDataTileLoader.ts`** — `generateOverpassQuery()`

Add selectors for:
- `way["landuse"~"farmland|meadow|orchard|vineyard|allotments|cemetery|construction|recreation_ground|residential|commercial|retail|industrial|military|plant_nursery"]`
- `way["leisure"="park"]`
- `way["natural"~"sand|beach|dune|bare_rock|scree|mud|glacier|fell|tundra|grassland"]`
- `way["aeroway"~"runway|taxiway|taxilane|apron|helipad"]`

Keep as single combined query. Existing selectors remain.

---

## Step 4: Update parser

**File: `src/data/contextual/ContextDataTileParser.ts`**

### 4a. Underground exclusion
At top of `processWay()`: skip if `tunnel=yes` OR `location=underground` OR `level < 0`.

### 4b. Landuse parsing
New classification branch: when `tags.landuse` matches a landuse type or `tags.leisure === 'park'`, create `LanduseVisual`. Must come before the `natural` catch-all. Move `natural=grassland` here too (same color as meadow).

### 4c. Road fixes
- Remove footway/path filter (line 247)
- New `getRoadWidthPx(type)`: returns exact pixel width per highway type from spec §5.5
- New `getRoadSurfaceColor(surface)`: returns color from surface table, or undefined
- Populate `widthPx` and `surfaceColor` on `RoadVisual`

### 4d. Railway fixes
- New `getRailwaySpec(type)`: returns `{ widthPx, dash, color }` per railway type from spec §5.6

### 4e. Water fixes
- New `getWaterwayWidthPx(type)`: returns pixel width for waterway lines from spec §5.3

### 4f. Aeroway expansion
- Match `tags.aeroway` for all subtypes (runway, taxiway, taxilane, apron, helipad) — not just aerodrome

---

## Step 5: Rewrite canvas renderer

**File: `src/visualization/terrain/texture/TerrainCanvasRenderer.ts`**

### 5a. Default ground fill
`#f0e8d8` → `#d8c8a8`

### 5b. Draw order (spec §3)
```ts
renderTile() {
  // 1. Base ground fill (fillRect)
  // 2. Landuse/landcover areas       — NEW
  // 3. Water bodies (polygons only)
  // 4. Wetlands                       — split from water
  // 5. Waterway lines                 — split from water, per-type widths
  // 6. Vegetation areas
  // 7. Aeroways                       — expanded
  // 8. (building shadows — skipped)
  // 9. Roads — sorted by widthPx ascending
  // 10. Railways — per-type width/dash
}
```

### 5c. New methods
- `drawLanduse()`: filled polygons, no stroke
- `drawWaterBodies()`: `water.isArea === true && water.type !== 'wetland'`
- `drawWetlands()`: `water.type === 'wetland'`
- `drawWaterwayLines()`: `water.isArea === false`, use `water.widthPx`

### 5d. Updated methods
- `drawRoads()`: sort by `widthPx` ascending, use `road.surfaceColor ?? road.color`, use `road.widthPx`
- `drawRailways()`: use `railway.widthPx` and `railway.dash`
- `drawAeroways()`: handle all subtypes with correct geometry/color

### 5e. Remove
- `drawBuildings()` — no longer needed for ground texture (buildings will be 3D)

---

## Step 6: Invalidate tile cache

**File: `src/data/contextual/ContextTilePersistenceCache.ts`**

Bump `DB_VERSION` from `1` → `2`. In `onupgradeneeded`, delete and recreate the object store to clear stale tiles with old colors/structure.

---

## Files Modified (summary)

| File | Change type |
|------|------------|
| `src/data/contextual/types.ts` | Add `LanduseVisual`, update road/railway/water types |
| `src/config.ts` | Replace color palette with spec values + width/dash tables |
| `src/data/contextual/ContextDataTileLoader.ts` | Expand Overpass query |
| `src/data/contextual/ContextDataTileParser.ts` | Landuse parsing, fix roads/railways/water, underground filter |
| `src/visualization/terrain/texture/TerrainCanvasRenderer.ts` | Correct draw order, per-type rendering, remove buildings |
| `src/data/contextual/ContextTilePersistenceCache.ts` | DB version bump |

---

## Verification

1. `bun run type-check` — no TypeScript errors
2. `bun run test` — all tests pass (update tests for changed types)
3. `bun run lint` — clean
4. `bun run dev` — fly over Paris, verify:
   - Default ground is sandy beige `#d8c8a8`
   - Roads are asphalt gray `#777060`, not orange/white
   - Seine is blue `#4a7ac0` with correct width
   - Parks are green `#90b860`
   - Built-up areas are warm gray `#d8d4cc`
   - Railways are dashed gray with correct per-type patterns
   - Layering: landuse → water → vegetation → roads → railways
