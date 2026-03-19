# Overture Maps — Base Theme

The base theme captures the physical geography of the world: water bodies, land cover, land use, and man-made infrastructure. It provides the foundational map layer beneath buildings and transportation.

**Theme name:** `base`

---

## Feature Types

- [bathymetry](#bathymetry)
- [infrastructure](#infrastructure)
- [land](#land)
- [land_cover](#land_cover)
- [land_use](#land_use)
- [water](#water)

---

## bathymetry

Underwater terrain represented as depth contours or polygons. Used to visualize ocean, lake, and river floor topology.

**Geometry types:** `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"bathymetry"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | No | Category of bathymetric feature |
| `depth` | number | No | Depth in meters (positive = below surface) |
| `names` | object | No | Localized names |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `ocean` | Ocean floor depth contour |
| `lake` | Lake bottom contour |
| `river` | River bed contour |

---

## infrastructure

Man-made structures and utilities that are not buildings: bridges, towers, power lines, pipelines, communication infrastructure, etc.

**Geometry types:** `Point`, `LineString`, `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"infrastructure"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | Yes | Broad infrastructure category |
| `class` | string | No | Specific infrastructure class within subtype |
| `names` | object | No | Localized names |
| `level` | integer | No | Vertical level (0 = ground) |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `barrier` | Fences, walls, hedges, retaining walls |
| `bridge` | Bridge structures |
| `communication` | Towers, masts, antennas |
| `manmade` | Miscellaneous man-made structures |
| `pedestrian` | Pedestrian-specific infrastructure |
| `pier` | Piers and jetties |
| `pipeline` | Pipes, conduits, canals |
| `power` | Power lines, pylons, substations |
| `recreation` | Sports and leisure infrastructure |
| `road` | Road-related structures (not segments) |
| `transit` | Transit stops, stations, depots |
| `utility` | Utility infrastructure |
| `waste_management` | Landfills, recycling centers |
| `water` | Water infrastructure (dams, reservoirs) |

### Class Values (selected)

`bridge`, `cable`, `dam`, `fence`, `gate`, `hedge`, `pier`, `pipeline`, `power_line`, `power_tower`, `retaining_wall`, `stadium`, `tower`, `tunnel`, `wall`

---

## land

Land polygons representing physical land surface, islands, and coastlines. Serves as the base fill layer for map rendering.

**Geometry types:** `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"land"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | No | Land category |
| `names` | object | No | Localized names |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `land` | General land area |
| `island` | Island landmass |
| `archipelago` | Group of islands |
| `islet` | Small island |
| `peninsula` | Peninsula landmass |
| `reef` | Reef or shoal |
| `rock` | Exposed rock |

> **Individual OSM features via `class`:** OSM-derived land features may carry `class: 'tree'` (Point) for a single tree (`natural=tree`) or `class: 'tree_row'` (LineString) for a row of trees (`natural=tree_row`). These route to the vegetation pipeline, not landuse.

---

## land_cover

Natural surface cover of the land: forests, grasslands, snow, sand, wetlands, etc. Overlays the base land layer.

**Geometry types:** `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"land_cover"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | Yes | Broad land cover category |
| `class` | string | No | Specific land cover class |
| `names` | object | No | Localized names |
| `source_tags` | object | No | Raw upstream tags |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `crop` | Agricultural crop land |
| `grass` | Grass and meadow |
| `moss` | Moss and tundra |
| `scrub` | Shrubs and scrubland |
| `snow` | Permanent snow and ice |
| `tree` | Forested area |
| `wetland` | Wetland and marsh |

### Class Values

`crop`, `farmland`, `grass`, `heath`, `mangrove`, `meadow`, `moss`, `orchard`, `scrub`, `snow`, `tree`, `wetland`, `wood`

> **`subtype: 'tree'` / `class: 'tree'`** in `land_cover` is always a forested polygon area. The classifier remaps this to `'forest'` for correct rendering via `ForestStrategy`.

---

## land_use

Human-designated use of land parcels: residential zones, commercial areas, parks, industrial land, airports, etc. Reflects intended or actual use rather than natural cover.

**Geometry types:** `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"land_use"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | Yes | Broad land use category |
| `class` | string | No | Specific land use class |
| `names` | object | No | Localized names |
| `level` | integer | No | Vertical level |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `agriculture` | Farmland and agricultural zones |
| `airport` | Airport and airfield areas |
| `aquaculture` | Fish farming and water cultivation |
| `cemetery` | Cemeteries and graveyards |
| `commercial` | Commercial and retail areas |
| `education` | Schools, universities, campuses |
| `entertainment` | Entertainment and leisure venues |
| `horticulture` | Gardens, nurseries, allotments |
| `industrial` | Industrial and manufacturing zones |
| `medical` | Hospitals and medical facilities |
| `military` | Military bases and restricted areas |
| `natural` | Protected natural areas |
| `pedestrian` | Pedestrian plazas and squares |
| `port` | Ports, harbors, marinas |
| `recreation` | Parks, sports, recreation areas |
| `religious` | Religious sites and grounds |
| `residential` | Residential neighborhoods |
| `resource_extraction` | Quarries, mines, pits |
| `transport` | Transport hubs and depots |
| `waste_management` | Landfills, recycling facilities |

---

## water

Water bodies: oceans, seas, lakes, rivers, canals, and ponds.

**Geometry types:** `Point`, `LineString`, `Polygon`, `MultiPolygon`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"base"` |
| `type` | string | Yes | `"water"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | Yes | Broad water category |
| `class` | string | No | Specific water class |
| `names` | object | No | Localized names |
| `is_salt` | boolean | No | `true` for salt water bodies |
| `is_intermittent` | boolean | No | `true` for seasonal/intermittent water |
| `level` | integer | No | Vertical level (e.g. underground rivers) |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

### Subtype Values

| Value | Description |
|-------|-------------|
| `human_made` | Canals, reservoirs, fountains |
| `physical` | Natural water bodies |

### Class Values

`bay`, `canal`, `channel`, `cove`, `ditch`, `fjord`, `harbor`, `lake`, `lagoon`, `ocean`, `pond`, `reef`, `reservoir`, `river`, `sea`, `sound`, `strait`, `stream`, `swimming_pool`, `wastewater`

---

## See Also

- [README.md](README.md) — theme overview and common fields
- [buildings.md](buildings.md) — building footprints and parts
- [transportation.md](transportation.md) — road and rail network
