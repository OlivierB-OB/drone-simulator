# OSM Key Organization

Alternative taxonomy organizing all 45 tags by OSM key hierarchy and type.

## Navigation

This index provides an alternative view of the same 45 tags documented in [../tags/](../tags/), organized by OSM key naming conventions.

**Primary reference:** [Tag Quick Reference](../tags/README.md)
**For values:** [Value Documentation](../values/README.md)

## Keys by OSM Namespace

### Core Building Keys

**Key: building**
- Main tag: [building](../tags/building.md) — building=*

**Key: building:type**
- Nested tag: [building:type](../tags/building_type.md) — building:type=*

**Key: building:part**
- Nested tag: [building:part](../tags/building_part.md) — building:part=*

**Key: building:levels**
- Nested tag: [building:levels](../tags/building_levels.md) — building:levels=[int]

**Key: building:min_level**
- Nested tag: [building:min_level](../tags/building_min_level.md) — building:min_level=[int]

**Key: building:material**
- Nested tag: [building:material](../tags/building_material.md) — building:material=*

**Key: building:colour**
- Nested tag: [building:colour](../tags/building_colour.md) — building:colour=*

### Height Keys (Multi-purpose)

**Key: height**
- Tag: [height](../tags/height.md) — height=[decimal]m
- Used on: buildings, trees, structures

**Key: min_height**
- Tag: [min_height](../tags/min_height.md) — min_height=[decimal]m
- Used on: buildings, structures

### Roof Keys

**Key: roof:shape**
- Tag: [roof:shape](../tags/roof_shape.md) — roof:shape=*

**Key: roof:colour**
- Tag: [roof:colour](../tags/roof_colour.md) — roof:colour=*

**Key: roof:material**
- Tag: [roof:material](../tags/roof_material.md) — roof:material=*

**Key: roof:height**
- Tag: [roof:height](../tags/roof_height.md) — roof:height=[decimal]m

**Key: roof:direction**
- Tag: [roof:direction](../tags/roof_direction.md) — roof:direction=[degrees]°

**Key: roof:orientation**
- Tag: [roof:orientation](../tags/roof_orientation.md) — roof:orientation=[degrees]°

### Highway Keys

**Key: highway**
- Tag: [highway](../tags/highway.md) — highway=*

**Key: surface**
- Tag: [surface](../tags/surface.md) — surface=*
- Used on: ways (roads, paths, railways)

**Key: lanes**
- Tag: [lanes](../tags/lanes.md) — lanes=[int]

### Road Infrastructure Keys

**Key: bridge**
- Tag: [bridge](../tags/bridge.md) — bridge=*

**Key: tunnel**
- Tag: [tunnel](../tags/tunnel.md) — tunnel=*

**Key: layer**
- Tag: [layer](../tags/layer.md) — layer=[int]
- Z-ordering for overlapping features

**Key: tree_lined**
- Tag: [tree_lined](../tags/tree_lined.md) — tree_lined=*

### Railway Keys

**Key: railway**
- Tag: [railway](../tags/railway.md) — railway=*

**Key: gauge**
- Tag: [gauge](../tags/gauge.md) — gauge=[int]mm or gauge=*

### Water Keys

**Key: water**
- Tag: [water](../tags/water.md) — water=*

**Key: waterway**
- Tag: [waterway](../tags/waterway.md) — waterway=*

**Key: level**
- Tag: [level](../tags/level.md) — level=[int]
- Used on: water features, buildings

### Natural Keys

**Key: natural**
- Tag: [natural](../tags/natural.md) — natural=*

**Key: leaf_type**
- Tag: [leaf_type](../tags/leaf_type.md) — leaf_type=*
- Used on: trees, vegetation

**Key: leaf_cycle**
- Tag: [leaf_cycle](../tags/leaf_cycle.md) — leaf_cycle=*
- Used on: trees, vegetation

**Key: diameter_crown**
- Tag: [diameter_crown](../tags/diameter_crown.md) — diameter_crown=[decimal]m

**Key: circumference**
- Tag: [circumference](../tags/circumference.md) — circumference=[decimal]m

**Key: diameter**
- Tag: [diameter](../tags/diameter.md) — diameter=[decimal]m
- Tree diameter at breast height (DBH)

### Land Use Keys

**Key: landuse**
- Tag: [landuse](../tags/landuse.md) — landuse=*

**Key: leisure**
- Tag: [leisure](../tags/leisure.md) — leisure=*

### Man-Made Keys

**Key: man_made**
- Tag: [man_made](../tags/man_made.md) — man_made=*

**Key: power**
- Tag: [power](../tags/power.md) — power=*

**Key: aerialway**
- Tag: [aerialway](../tags/aerialway.md) — aerialway=*

**Key: aeroway**
- Tag: [aeroway](../tags/aeroway.md) — aeroway=*

**Key: barrier**
- Tag: [barrier](../tags/barrier.md) — barrier=*

### Material Keys

**Key: material**
- Tag: [material](../tags/material.md) — material=*
- Used on: structures, barriers

### Location Keys

**Key: location**
- Tag: [location](../tags/location.md) — location=*
- Placement modifier (e.g., location=underground)

## Key Hierarchies

### Nested Keys (building:*)

```
building (primary tag)
├── building:type      — Classification
├── building:part      — Component type
├── building:levels    — Floor count
├── building:min_level — Lowest floor
├── building:material  — Wall material
└── building:colour    — Wall color
```

### Nested Keys (roof:*)

```
roof (implicit via building)
├── roof:shape       — Roof form
├── roof:colour      — Roof color
├── roof:material    — Roof surface
├── roof:height      — Roof height
├── roof:direction   — Slope direction (deprecated)
└── roof:orientation — Orientation
```

### Multi-purpose Keys (no namespace)

Keys used across multiple feature types:
- **height** — Buildings, structures, trees, vegetation
- **min_height** — Buildings, structures
- **surface** — Roads, paths, railways (any way)
- **layer** — Z-ordering for overlapping features
- **level** — Buildings, water features
- **material** — Barriers, man-made structures
- **diameter** — Trees (DBH measurement)
- **location** — Any feature with placement modifiers

## Data Types

### Enumeration Keys

Keys with predefined values (from OSM specification):

- building, building:type, building:part
- building:material, building:colour
- roof:shape, roof:colour, roof:material
- roof:direction, roof:orientation
- highway, surface, lanes
- bridge, tunnel, tree_lined, layer
- railway, gauge
- water, waterway, level
- natural, leaf_type, leaf_cycle, leaf_type
- landuse, leisure
- man_made, power, aerialway, aeroway, barrier
- material, location

### Numeric Keys

Keys with numeric values:

| Key | Format | Example |
|-----|--------|---------|
| height | Decimal meters | `12.5` |
| min_height | Decimal meters | `3.0` |
| building:levels | Integer | `4` |
| building:min_level | Integer | `0` |
| roof:height | Decimal meters | `2.5` |
| lanes | Integer | `2` |
| level | Integer | `1` |
| diameter_crown | Decimal meters | `8.5` |
| circumference | Decimal meters | `3.14` |
| diameter | Decimal meters | `1.0` |
| gauge | Integer mm or enum | `1435` or `narrow` |
| layer | Integer | `1` |

### Angle Keys

Keys with compass bearings:

| Key | Format | Range |
|-----|--------|-------|
| roof:direction | Degrees | 0-360° |
| roof:orientation | Degrees | 0-360° |

## Key Grouping by Usage

### Building Visualization Keys (11)
- building, building:type, building:part
- height, min_height
- building:levels, building:min_level
- building:material, building:colour
- roof:shape, roof:colour, roof:material, roof:height
- roof:direction, roof:orientation

### Road Visualization Keys (4)
- highway, surface, lanes, bridge

### Railway Visualization Keys (2)
- railway, gauge

### Water Visualization Keys (3)
- water, waterway, level

### Vegetation Visualization Keys (7)
- natural, leaf_type, leaf_cycle
- diameter_crown, circumference
- landuse, leisure

### Infrastructure Visualization Keys (9)
- man_made, power, aerialway, aeroway, barrier
- material, diameter
- layer, location

## Total Count: 45 Keys

| Category | Count |
|----------|-------|
| Building (building:*) | 7 |
| Height (height/*) | 2 |
| Roof (roof:*) | 6 |
| Road (highway/*) | 4 |
| Rail (railway/*) | 2 |
| Water (water/*) | 3 |
| Natural (natural/*) | 5 |
| Land use (landuse/*) | 2 |
| Infrastructure | 9 |
| Modifiers | 3 |
| **Total** | **43** |

*Note: Some keys like height, surface, level are multi-purpose and appear in multiple contexts.*

## See Also

- [Tag Quick Reference](../tags/README.md) — All 45 tags organized by category
- [Value Documentation](../values/README.md) — Specific values for each tag
- [OSM Key Category](https://wiki.openstreetmap.org/wiki/Category:Keys) — Official OSM documentation
