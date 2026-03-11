**OSM Wiki:** https://wiki.openstreetmap.org/wiki/3D_development/Tagging

# 3D Development/Tagging

> **Note:** This page documents historical concepts for 3D mapping in OpenStreetMap and is marked as a historic artifact and out-of-date. For buildings, most tools accept **Simple 3D Buildings** instead.

## Current Tagging Schemes

### Building Tags

The foundational approach uses `building=*` to differentiate building types (e.g., `building=farm`) combined with amenity tags like `amenity=kindergarten`. Entrance points use `building=entrance`.

### Building Attributes

Key attributes for 3D modeling:

| Category | Tags |
|----------|------|
| Dimensions | `height=*`, `min_height=*`, `building:levels=*`, `building:min_level=*` |
| Structure | `building:shape=*`, `building:cladding=*`, `building:architecture=*` |
| Roof Details | `roof:shape=*`, `roof:angle=*`, `roof:height=*`, `roof:material=*`, `roof:orientation=*` |
| Appearance | `building:facade:colour=*`, `building:facade:material=*` |
| Level Info | `building:levels:underground=*`, `building:levels:aboveground=*`, `building:levels:mezzanine=*` |

### Transportation Tags

Common transportation-related tags include `highway=*`, `railway=*`, `aeroway=*`, `waterway=*`, `surface=*`, `bridge=*`, `tunnel=*`, and `width=*`.

### Equipment & Nature Tags

Equipment: `man_made=lighthouse`, `power_source=wind`, `barrier=fence`, `barrier=wall`

Nature: `landuse=forest`, `natural=tree`, `natural=water`, `leisure=park`

## Tools Supporting 3D OSM Data

| Tool | Notes |
|------|-------|
| **OSM-3D** | Uses building attributes subset |
| **OSM2World** | Comprehensive tag support |
| **Kendzi 3D** | JOSM plugin with road, tree, building, water, and fence support |
| **OSM2POV** | POV-Ray rendering tool |
| **glosm** | Early-stage development application |
| **F4 Map** | Web-based 3D visualization |
| **osm2x3d** | Conversion tool |

## Community Usage

Most commonly used tags in the community are `building=yes`, specific `building=*` types, `height=*`, and `building:levels=*`.
