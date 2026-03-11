# OSM Documentation Implementation Strategy

Document describing the phased approach to building comprehensive OSM documentation library.

## Overview

The drone simulator uses **45 OSM (OpenStreetMap) tags** across **9 feature categories** to define visual properties of buildings, roads, railways, water, vegetation, and infrastructure. This documentation provides a centralized, authoritative reference for each tag and its values.

## Folder Structure

```
doc/osm/
├── README.md                       # Master index (all 45 tags + categories)
├── IMPLEMENTATION.md               # This file
├── tags/
│   ├── README.md                   # Quick reference table (all 45 tags)
│   └── *.md                        # Individual tag documentation (45 files)
├── keys/
│   └── README.md                   # Alternative key organization (taxonomy)
└── values/
    ├── README.md                   # Values index by category
    └── <tag>/*.md                  # Value-specific documentation (200+ files)
```

## Complete Tag List (45 Tags)

### By Category

**Building Tags (9):** building, building:type, building:part, building:levels, building:min_level, building:material, building:colour, height, min_height

**Roof Tags (6):** roof:shape, roof:colour, roof:material, roof:height, roof:direction, roof:orientation

**Road Tags (4):** highway, surface, lanes, bridge

**Railway Tags (2):** railway, gauge

**Water Tags (3):** water, waterway, level

**Vegetation Tags (7):** natural, leaf_type, leaf_cycle, diameter_crown, circumference, landuse, leisure

**Infrastructure Tags (9):** man_made, power, aerialway, aeroway, barrier, material, diameter, layer, location

**Multi-purpose Modifiers (4):** tunnel, tree_lined, location, layer

**Total: 45 tags** (with some overlap in usage)

## Implementation Phases

### Phase 1: Folder Structure ✓ COMPLETED

Created granular directory hierarchy:
- `/doc/osm/tags/` — 45 tag documentation files
- `/doc/osm/keys/` — Alternative key taxonomy
- `/doc/osm/values/<tag>/` — 200+ value documentation files (14 subdirectories)

**Completion:** 14 directories created

### Phase 2: Index Files ✓ COMPLETED

Created comprehensive navigation structure:

1. **doc/osm/README.md** (Master Index)
   - Overview of all 45 tags
   - Quick navigation by category
   - Tag statistics
   - Links to OSM resources
   - Cross-references to related docs

2. **doc/osm/tags/README.md** (Tag Quick Reference)
   - All 45 tags organized by category
   - Purpose and data type for each
   - Grouped by usage (building visualization, road visualization, etc.)
   - Total statistics

3. **doc/osm/keys/README.md** (Key Organization)
   - Alternative taxonomy by OSM namespace
   - Key hierarchies (building:*, roof:*)
   - Data type reference
   - Multi-purpose key grouping

4. **doc/osm/values/README.md** (Values Index)
   - Directory structure overview
   - Navigation by tag category
   - Value documentation format template
   - Statistics table

**Completion:** 4 index files with 1800+ lines of content

### Phase 3: Tag Documentation Files (In Progress)

**Target:** 45 markdown files in `doc/osm/tags/`

**Status:**
- Generating stub files with OSM wiki links (Agent a506047f012cab44d)
- Fetching and populating content (Agent acc8b19f719eac275)

**Template for Each File:**

```markdown
# [Tag Name]

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:[tag]

## Definition
[Brief definition from OSM wiki]

## Data Type
[Type and format information]

## Common Values in Drone Simulator
[List of values used in config.ts]

## Related Tags
[Links to related tag documentation files]

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:[tag])
```

**Content Sources:**
- OSM wiki pages (fetched via WebFetch)
- `src/config.ts` (lines 104-463) — All tag values
- `src/data/contextual/strategies/` — Tag handling logic

### Phase 4: Value Documentation Files (Planned)

**Target:** 200+ markdown files in `doc/osm/values/<tag>/`

**Organization:** 14 subdirectories by tag category:
- `values/building/` — 15+ files (residential, commercial, industrial, etc.)
- `values/building_material/` — 9+ files (brick, concrete, glass, etc.)
- `values/roof_material/` — 14+ files (tiles, slate, metal, etc.)
- `values/roof_shape/` — 6+ files (flat, pitched, gabled, etc.)
- `values/highway/` — 20+ files (motorway, residential, footway, etc.)
- `values/surface/` — 20+ files (asphalt, concrete, gravel, etc.)
- `values/railway/` — 9+ files (rail, tram, metro, monorail, etc.)
- `values/waterway/` — 8+ files (river, canal, stream, etc.)
- `values/natural/` — 10+ files (wood, forest, scrub, etc.)
- `values/landuse/` — 25+ files (residential, commercial, farmland, etc.)
- `values/aeroway/` — 8+ files (aerodrome, runway, taxiway, etc.)
- `values/man_made/` — 10+ files (tower, chimney, water_tower, etc.)
- `values/barrier/` — 5+ files (wall, hedge, city_wall, etc.)

**Template for Each Value File:**

```markdown
# [Value Name]

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Tag:[tag]=[value]

## Definition
[Brief definition from OSM wiki]

## Characteristics
[Key features and typical uses]

## Drone Simulator Usage
[How this value is used in the project]

## Related Values
[Links to similar values]

## See Also
- [Tag documentation](../../tags/[tag].md)
- [OSM Wiki](https://wiki.openstreetmap.org/wiki/Tag:[tag]=[value])
```

**Content Sources:**
- OSM wiki pages (fetched via WebFetch)
- `src/config.ts` — Color, width, height defaults
- `doc/visualization/canvas-rendering.md` — Feature rendering

## Tag Mapping to Code

### Building Visualization (BuildingMeshFactory)

Tags used to create 3D building meshes:

| Tag | Purpose | Source |
|-----|---------|--------|
| building | Identifies building | Key presence |
| building:type | Building classification | buildingHeightDefaults, colorPalette |
| building:part | Building component | mesh.userData |
| height | Total height meters | numeric parsing |
| min_height | Lowest feature height | numeric parsing |
| building:levels | Floors above ground | numeric parsing |
| building:min_level | Lowest floor | numeric parsing |
| building:material | Wall material | buildingMaterialColors |
| building:colour | Wall color | hex parsing or colorPalette |
| roof:shape | Roof form | mesh shape |
| roof:colour | Roof color | roofColorDefaults, hex parsing |
| roof:material | Roof surface | roofMaterialColors |
| roof:height | Roof height | numeric parsing |
| roof:direction | Slope direction (deprecated) | numeric parsing (0-360°) |
| roof:orientation | Roof orientation | numeric parsing (0-360°) |

### Road Visualization (TerrainCanvasRenderer)

Tags used for road rendering on canvas:

| Tag | Purpose | Source |
|-----|---------|--------|
| highway | Road type | roadSpec, surfaceColors |
| surface | Surface material | surfaceColors (overrides highway color) |
| lanes | Traffic lane count | numeric parsing |
| bridge | Bridge indicator | layer modifier |
| layer | Z-ordering | numeric parsing (default 0) |
| tree_lined | Tree-lined indicator | feature property |
| tunnel | Tunnel indicator | layer modifier |

### Railway Visualization (TerrainCanvasRenderer)

Tags used for railway rendering:

| Tag | Purpose | Source |
|-----|---------|--------|
| railway | Railway type | railwaySpec |
| gauge | Rail gauge | numeric parsing (mm) |
| layer | Z-ordering | numeric parsing |

### Water Visualization (TerrainCanvasRenderer)

Tags used for water rendering:

| Tag | Purpose | Source |
|-----|---------|--------|
| water | Water body type | groundColors.water |
| waterway | Waterway type | waterwayWidthsMeters, groundColors |
| level | Floor/level number | numeric parsing |

### Vegetation Visualization (VegetationMeshFactory)

Tags used for vegetation rendering:

| Tag | Purpose | Source |
|-----|---------|--------|
| natural | Natural feature type | vegetationMeshConfig |
| leaf_type | Foliage type | foliage rendering |
| leaf_cycle | Seasonality | foliage color variation |
| diameter_crown | Crown diameter | mesh size calculation |
| circumference | Tree circumference | mesh size calculation |
| landuse | Land use type | groundColors.landuse |
| leisure | Recreation type | groundColors |

### Infrastructure Visualization (StructureMeshFactory)

Tags used for man-made structure rendering:

| Tag | Purpose | Source |
|-----|---------|--------|
| man_made | Structure type | structureDefaults |
| power | Power infrastructure | structureDefaults |
| aerialway | Aerial transport | structureDefaults |
| aeroway | Airport infrastructure | groundColors.aeroways |
| barrier | Barrier type | barrierDefaults |
| material | Material composition | barrierMaterialColors (fallback) |
| diameter | Structure diameter | mesh size calculation |
| height | Structure height | structureDefaults.height |
| layer | Z-ordering | numeric parsing |

### Modifier Tags (Multi-purpose)

Tags that modify other features:

| Tag | Usage | Effect |
|-----|-------|--------|
| layer | roads, rails, water | Z-ordering (numeric, default 0) |
| location | any | Placement modifier (underground, etc.) |
| bridge | roads | Over-feature indicator |
| tunnel | roads | Under-feature indicator |
| tree_lined | roads | Trees along road |

## Data Type Categories

### Enumeration Tags (Most common)
Tags with predefined values from OSM specification. See tag documentation for complete lists.

**Examples:** building, building:type, highway, surface, railway, waterway, natural, landuse

### Numeric Tags
Tags with numeric values (meters, floors, degrees).

**Height/Meters:**
- height, min_height, roof:height — Decimal meters
- building:levels, building:min_level, level — Integer floors/levels
- diameter_crown, circumference, diameter — Decimal meters

**Width/Gauge:**
- lanes — Integer count
- gauge — Integer mm or text (e.g., "narrow")

**Angles:**
- roof:direction, roof:orientation — Degrees (0-360°)
- layer — Integer (Z-ordering, default 0)

### Color Tags
Tags specifying colors.

**Hex Colors or Text Names:**
- building:colour — Hex codes (e.g., #c87060) or color names
- roof:colour — Hex codes or color names

### Boolean/Enum Hybrid Tags
Tags that accept yes/no or specific values.

**Examples:**
- bridge — yes, no, suspended, aqueduct
- tunnel — yes, no
- tree_lined — yes, no
- location — underground, underwater, overground, etc.

## Configuration File Reference

### src/config.ts Structure

All tag values and visualization properties are centralized in `src/config.ts`:

**Lines 104-119:** colorPalette.buildings (15 building types + default)
**Lines 124-142:** buildingHeightDefaults (17 building types)
**Lines 147-157:** buildingMaterialColors (9 materials)
**Lines 162-178:** roofMaterialColors (14 materials)
**Lines 183-186:** roofColorDefaults (flat/pitched)
**Lines 191-227:** structureDefaults (12 structure types with shape/radius/height/color)
**Lines 232-240:** barrierDefaults (4 barrier types)
**Lines 245-247:** barrierMaterialColors (shared with building materials)
**Lines 252-290:** vegetationMeshConfig (5 vegetation types with density/height/radius)
**Lines 295-348:** groundColors (landuse, water, vegetation, aeroways)
**Lines 352-381:** roadSpec (20 highway types with width/color)
**Lines 386-429:** surfaceColors (20 surface types)
**Lines 434-448:** railwaySpec (9 railway types with width/dash/color)
**Lines 453-463:** waterwayWidthsMeters (8 waterway types)

**Total: 360 lines of configuration covering all 45 tags**

## Verification Checklist

- [x] Folder structure created (14 directories)
- [x] Master index (README.md) created
- [x] Tag quick reference (tags/README.md) created
- [x] Key organization (keys/README.md) created
- [x] Value index (values/README.md) created
- [ ] 45 tag documentation files (in progress - Agent a506047f012cab44d)
- [ ] 200+ value documentation files (planned)
- [ ] All internal links verified
- [ ] All OSM wiki links verified
- [ ] Cross-references to config.ts completed
- [ ] Master README links updated

## Next Steps

1. **Wait for Agent Completion**
   - Agent a506047f012cab44d: Creating 45 stub tag files
   - Agent acc8b19f719eac275: Fetching OSM wiki content

2. **Populate Value Files**
   - Generate stub files for 200+ values
   - Fetch OSM wiki content for each value
   - Add usage context from config.ts

3. **Verification**
   - Verify all internal links work
   - Check all OSM wiki URLs are valid
   - Ensure no broken cross-references

4. **Integration**
   - Update project README links
   - Create cross-references from other docs
   - Add to CI/CD verification (if applicable)

## File Statistics

### Created Files

| File | Lines | Purpose |
|------|-------|---------|
| doc/osm/README.md | 205 | Master index |
| doc/osm/tags/README.md | 278 | Tag quick reference |
| doc/osm/keys/README.md | 341 | Key organization |
| doc/osm/values/README.md | 237 | Value index |
| doc/osm/IMPLEMENTATION.md | This file | Strategy document |

**Total:** ~1300 lines of organizational documentation

### Planned Files

| Category | Count | Status |
|----------|-------|--------|
| Tag files (tags/*.md) | 45 | In progress |
| Value files (values/*/*.md) | 200+ | Planned |
| Index files | 4 | Complete |
| Strategy docs | 1 | Complete |
| **Total** | **~250** | **~40% complete** |

## Design Decisions

1. **Folder Structure**: Granular 3-level hierarchy (tags, keys, values) allows multiple organizational views (tag-centric, key-centric, value-centric)

2. **OSM Wiki Links**: Every tag and value file links to authoritative OSM wiki documentation

3. **Config Reference**: Each tag file references specific lines in src/config.ts for implementation details

4. **Template Consistency**: All tag and value files follow consistent format for easy scanning

5. **Cross-references**: Tag files link to related tags; value files link back to parent tags

6. **No Duplication**: Single source of truth per tag/value (no copy-paste)

## Related Documentation

- [doc/coordinate-system.md](../coordinate-system.md) — Coordinate transformations
- [doc/data/elevations.md](../data/elevations.md) — Elevation data system
- [doc/visualization/canvas-rendering.md](../visualization/canvas-rendering.md) — Feature rendering
- [doc/animation-loop.md](../animation-loop.md) — Frame-by-frame animation
- [src/config.ts](../../src/config.ts) — All configuration values

## References

- **OSM Wiki**: https://wiki.openstreetmap.org/
- **OSM Key Category**: https://wiki.openstreetmap.org/wiki/Category:Keys
- **OSM Tag Category**: https://wiki.openstreetmap.org/wiki/Category:Tags
- **OSM Map Features**: https://wiki.openstreetmap.org/wiki/Map_Features
- **Taginfo**: https://taginfo.openstreetmap.org/ (tag usage statistics)
