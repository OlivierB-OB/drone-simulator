# Overture Maps Schema Reference

Overture Maps Foundation publishes open map data with a structured, versioned schema. Unlike OSM (which uses free-form key/value tags), Overture data is strongly typed with explicit field names, types, and enumerations — making it easier to parse and validate programmatically.

## Themes

| Theme | Feature Types | Description |
|-------|--------------|-------------|
| [base](base.md) | `bathymetry`, `infrastructure`, `land`, `land_cover`, `land_use`, `water` | Physical geography and man-made infrastructure |
| [buildings](buildings.md) | `building`, `building_part` | Building footprints and 3D part geometry |
| [transportation](transportation.md) | `connector`, `segment` | Road and rail network topology |

## GERS Identifier

Every Overture feature carries a **GERS ID** (`id` field) — a globally unique, stable identifier managed by the Global Entity Reference System. GERS IDs persist across dataset releases, enabling reliable cross-referencing and change detection.

Format: UUID string (e.g. `08f2a8bfa5a6b5c90368df4f5c3f1234`)

## Cross-Cutting Schema Patterns

These fields appear across multiple themes and follow consistent conventions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Globally unique GERS identifier |
| `bbox` | object | Yes | Bounding box: `xmin`, `ymin`, `xmax`, `ymax` (WGS84 degrees) |
| `theme` | string | Yes | Theme name (e.g. `base`, `buildings`, `transportation`) |
| `type` | string | Yes | Feature type within the theme |
| `version` | integer | Yes | Feature version; increments on each update |
| `sources` | array | Yes | List of source records: `{dataset, record_id, confidence, update_time}` |
| `names` | object | No | Localized names: `primary` (string) + `common` (map of language→string) |
| `level` | integer | No | Vertical level relative to ground (0 = ground, negative = underground) |
| `source_tags` | object | No | Raw key/value tags preserved from the upstream source |
| `wikidata` | string | No | Wikidata QID (e.g. `Q42`) for linked-data integration |
| `cartography` | object | No | Rendering hints: `min_zoom`, `max_zoom`, `sort_key` |

## Data Format

Overture data is distributed as **GeoParquet** files partitioned by theme and region. Each row is a GeoJSON-compatible feature with a `geometry` column (WKB-encoded) and typed property columns.

## Current Usage

The simulator consumes a subset of the full Overture schema. This document serves as a reference for all available fields; the actual fields used by the classifier functions are:

| Theme | Consumed Fields | Classifier |
|-------|----------------|------------|
| buildings | `class`, `height`, `num_floors`, `min_height`, `has_parts`, `facade_color`, `facade_material`, `roof_shape`, `roof_color`, `roof_material`, `roof_height`, `roof_direction`, `roof_orientation` | `classifyOvertureBuilding` |
| transportation | `class`, `subtype`, `road_surface`, `lanes`, `is_bridge`, `is_tunnel`, `layer` | `classifyOvertureRoad`, `classifyOvertureRailway` |
| base (land_use) | `class` | `classifyOvertureLanduse` |
| base (land) | `subtype`, `class`, `source_tags`¹ | `classifyOvertureLanduse`, `classifyOvertureVegetation` |
| base (land_cover) | `class`, `source_tags`¹ | `classifyOvertureVegetation` |
| base (water) | `class`, `is_intermittent` | `classifyOvertureWater` |
| base (infrastructure) | `class`, `height` | `classifyOvertureAeroway`, `classifyOvertureBarrier`, `classifyOvertureStructure` |

Cross-cutting fields like `id`, `bbox`, and `sources` are available but not directly used for rendering.

¹ `source_tags` is used by `classifyOvertureVegetation` to extract OSM-origin 3D attributes: `leaf_type`, `leaf_cycle`, `diameter_crown`, and `circumference`. These feed the tree mesh strategies (`SingleTreeStrategy`, `ForestStrategy`, `TreeRowStrategy`) for canopy shape, color variation, and trunk/crown sizing.

## See Also

- [coordinate-system.md](../coordinate-system.md) — how Overture coordinates map to the Three.js scene
- [contextual.md](../data/contextual.md) — how Overture data is loaded and cached at runtime
- [canvas-rendering.md](../visualization/canvas-rendering.md) — how Overture features are rasterized to canvas textures
