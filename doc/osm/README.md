# OSM Documentation Reference

Comprehensive reference documentation for all OpenStreetMap (OSM) tags used in the drone simulator project.

## Quick Navigation

### By Tag Type

- **[Building Tags](#building-tags)** — Structure and appearance (11 tags)
- **[Roof Tags](#roof-tags)** — Roof characteristics (7 tags)
- **[Road Tags](#road-tags)** — Highway and surface properties (4 tags)
- **[Railway Tags](#railway-tags)** — Railway infrastructure (2 tags)
- **[Water Tags](#water-tags)** — Water features and properties (3 tags)
- **[Vegetation Tags](#vegetation-tags)** — Trees and natural areas (6+ tags)
- **[Infrastructure Tags](#infrastructure-tags)** — Man-made structures (5+ tags)

### Directory Structure

```
doc/osm/
├── README.md                   # This file - master index
├── tags/
│   ├── README.md               # All 45 tag quick reference
│   └── *.md                    # Individual tag documentation (45 files)
├── keys/
│   └── README.md               # Alternative taxonomy (key organization)
└── values/
    ├── README.md               # Value documentation index
    ├── building/               # building= values (15+ files)
    ├── building_type/          # building:type= values (8+ files)
    ├── building_material/      # building:material= values (8+ files)
    ├── roof_material/          # roof:material= values (10+ files)
    ├── roof_shape/             # roof:shape= values (6+ files)
    ├── highway/                # highway= values (20+ files)
    ├── surface/                # surface= values (20+ files)
    ├── railway/                # railway= values (10+ files)
    ├── waterway/               # waterway= values (8+ files)
    ├── natural/                # natural= values (10+ files)
    ├── landuse/                # landuse= values (15+ files)
    ├── aeroway/                # aeroway= values (8+ files)
    ├── man_made/               # man_made= values (10+ files)
    └── barrier/                # barrier= values (5+ files)
```

## Tag Categories

### Building Tags

Core building structure documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [building](tags/building.md) | Identifies building elements | Key enumeration |
| [building:type](tags/building_type.md) | Building classification | Text/enum |
| [building:part](tags/building_part.md) | Building component classification | Text/enum |
| [building:levels](tags/building_levels.md) | Number of floors above ground | Integer |
| [building:min_level](tags/building_min_level.md) | Lowest floor number | Integer |
| [building:material](tags/building_material.md) | Wall material | Text/enum |
| [building:colour](tags/building_colour.md) | Wall color | Hex color or text |
| [height](tags/height.md) | Total height in meters | Decimal |
| [min_height](tags/min_height.md) | Height to lowest feature | Decimal |

### Roof Tags

Roof-specific documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [roof:shape](tags/roof_shape.md) | Roof form | Text/enum |
| [roof:colour](tags/roof_colour.md) | Roof color | Hex color or text |
| [roof:material](tags/roof_material.md) | Roof surface material | Text/enum |
| [roof:height](tags/roof_height.md) | Roof height above building | Decimal |
| [roof:direction](tags/roof_direction.md) | Roof slope direction (deprecated) | Degrees |
| [roof:orientation](tags/roof_orientation.md) | Roof orientation | Degrees |

### Road Tags

Highway and surface documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [highway](tags/highway.md) | Road/path type | Text/enum |
| [surface](tags/surface.md) | Road surface material | Text/enum |
| [lanes](tags/lanes.md) | Number of traffic lanes | Integer |
| [bridge](tags/bridge.md) | Bridge indicator | Boolean/enum |

### Railway Tags

Rail infrastructure documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [railway](tags/railway.md) | Railway type | Text/enum |
| [gauge](tags/gauge.md) | Rail gauge in mm | Integer or text |

### Water Tags

Water features documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [water](tags/water.md) | Water body type | Text/enum |
| [waterway](tags/waterway.md) | Waterway type | Text/enum |

### Vegetation Tags

Tree and natural area documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [natural](tags/natural.md) | Natural feature type | Text/enum |
| [leaf_type](tags/leaf_type.md) | Tree foliage type | Text/enum |
| [leaf_cycle](tags/leaf_cycle.md) | Foliage seasonality | Text/enum |
| [diameter_crown](tags/diameter_crown.md) | Crown diameter in meters | Decimal |
| [circumference](tags/circumference.md) | Tree circumference at breast height | Decimal |
| [landuse](tags/landuse.md) | Land use classification | Text/enum |

### Infrastructure Tags

Man-made structures documentation:

| Tag | Purpose | Data Type |
|-----|---------|-----------|
| [man_made](tags/man_made.md) | Man-made structure type | Text/enum |
| [power](tags/power.md) | Power infrastructure | Text/enum |
| [aerialway](tags/aerialway.md) | Aerial transport | Text/enum |
| [aeroway](tags/aeroway.md) | Airport infrastructure | Text/enum |
| [barrier](tags/barrier.md) | Barrier type | Text/enum |

## Statistics

| Category | Count | Status |
|----------|-------|--------|
| Tag documentation files | 45 | In progress |
| Value documentation files | 200+ | Planned |
| Index files | 4 | Planned |
| **Total markdown files** | **~250** | **Planned** |

## Usage

1. **Look up a tag:** Browse [doc/osm/tags/](tags/) or use the tag table above
2. **Find specific values:** See [doc/osm/values/](values/) organized by tag category
3. **Cross-reference:** Each tag file includes links to related tags and OSM wiki

## Related Documentation

- [doc/coordinate-system.md](../coordinate-system.md) — Coordinate system transformation (Mercator → Three.js)
- [doc/data/elevations.md](../data/elevations.md) — Elevation data system
- [doc/visualization/canvas-rendering.md](../visualization/canvas-rendering.md) — OSM feature rendering
- [src/config.ts](../../src/config.ts) — Configuration and color palettes

## OSM Resources

- **OSM Wiki:** https://wiki.openstreetmap.org/
- **OSM Key Documentation:** https://wiki.openstreetmap.org/wiki/Category:Keys
- **OSM Tag Documentation:** https://wiki.openstreetmap.org/wiki/Category:Tags
- **Overpass API:** https://overpass-api.de/ (data queries)
- **Taginfo:** https://taginfo.openstreetmap.org/ (tag statistics)

## See Also

- [Tags Index](tags/README.md) — Quick reference for all 45 tags
- [Keys Index](keys/README.md) — Alternative key organization
- [Values Index](values/README.md) — Value documentation by category
