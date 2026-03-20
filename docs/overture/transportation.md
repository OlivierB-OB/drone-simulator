# Overture Maps — Transportation Theme

The transportation theme models the road and rail network as a topological graph. It uses two complementary feature types: **segments** (edges) carry geometry and attributes, while **connectors** (nodes) define where segments meet and enable routing.

**Theme name:** `transportation`

---

## Feature Types

- [connector](#connector) — network node at a junction or endpoint
- [segment](#segment) — network edge with road/rail attributes and linear rules

---

## connector

A point where two or more segments meet. Connectors define the topology of the transportation graph without carrying travel-cost or attribute data themselves.

**Geometry types:** `Point`

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"transportation"` |
| `type` | string | Yes | `"connector"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `level` | integer | No | Vertical level (0 = ground, negative = tunnel, positive = bridge) |
| `source_tags` | object | No | Raw upstream tags |
| `cartography` | object | No | Rendering hints |

Connectors are referenced by segments via the `connectors` array. A segment's start and end points correspond to the first and last connector in that list.

---

## segment

A directed or undirected edge in the transportation network. Carries geometry, classification, travel rules, and linearly-referenced attributes.

**Geometry types:** `LineString`

### Core Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | GERS identifier |
| `bbox` | object | Yes | Bounding box |
| `theme` | string | Yes | `"transportation"` |
| `type` | string | Yes | `"segment"` |
| `version` | integer | Yes | Feature version |
| `sources` | array | Yes | Source provenance records |
| `subtype` | string | Yes | `"road"`, `"rail"`, or `"water"` |
| `connectors` | array | Yes | Ordered connector IDs; first = start, last = end |
| `names` | object | No | Localized names |
| `source_tags` | object | No | Raw upstream tags |
| `wikidata` | string | No | Wikidata QID |
| `cartography` | object | No | Rendering hints |

---

### Road-Specific Fields

Applies when `subtype` is `"road"`.

| Field | Type | Description |
|-------|------|-------------|
| `road_class` | string | Functional road class (see RoadClass) |
| `road_surface` | string | Pavement surface type (see RoadSurface) |
| `road_flags` | array | Linearly-referenced boolean road characteristics (see RoadFlagRule) |
| `level_rules` | array | Linearly-referenced Z-order rules; entries with `level < 0` are underground (see LevelRule) |
| `speed_limits` | array | Linearly-referenced speed limit rules (see SpeedLimitRule) |
| `access_restrictions` | array | Linearly-referenced access rules (see AccessRestrictionRule) |
| `width_rules` | array | Linearly-referenced lane/width rules |
| `lanes` | object | Lane count and direction configuration |
| `is_link` | boolean | `true` for on/off ramps and connector links |
| `is_private` | boolean | `true` for private roads |
| `turn_restrictions` | array | Turn restriction records at junctions |

---

### Rail-Specific Fields

Applies when `subtype` is `"rail"`.

| Field | Type | Description |
|-------|------|-------------|
| `rail_class` | string | Rail network class (see RailClass) |
| `is_electrified` | boolean | `true` if the line is electrified |
| `gauge` | integer | Track gauge in millimeters |
| `max_speed` | integer | Maximum operating speed in km/h |
| `is_freight` | boolean | `true` if the line carries freight |
| `is_high_speed` | boolean | `true` for high-speed rail lines |
| `rail_flags` | array | Linearly-referenced boolean rail characteristics (see RailFlagRule) |
| `level_rules` | array | Linearly-referenced Z-order rules; entries with `level < 0` are underground (see LevelRule) |

---

### Water-Specific Fields

Applies when `subtype` is `"water"`. Water segments carry no subtype-specific fields; only the [Core Properties](#core-properties) apply.

> **Note:** Water segments are skipped during parsing (`OvertureParser.ts`). Water bodies are already rendered via the base land/water layer, so processing them as transport features would cause misclassification artifacts.

---

## Enumeration Reference

### RoadClass (17 values)

| Value | Description |
|-------|-------------|
| `motorway` | Controlled-access highway (highest classification) |
| `trunk` | Major road, not full motorway standards |
| `primary` | Primary road connecting major cities |
| `secondary` | Secondary road connecting towns |
| `tertiary` | Tertiary road connecting villages |
| `residential` | Road serving residential areas |
| `living_street` | Pedestrian-priority street with vehicle access |
| `unclassified` | Minor road without specific classification |
| `service` | Access road for facilities or parking |
| `driveway` | Private driveway |
| `pedestrian` | Pedestrian-only road or street |
| `footway` | Designated footpath |
| `path` | Unpaved path for pedestrians or mixed use |
| `cycleway` | Designated cycle path |
| `bridleway` | Path for horses |
| `track` | Agricultural or forestry track |
| `unknown` | Classification not determined |

### RailClass (8 values)

| Value | Description |
|-------|-------------|
| `rail` | Standard mainline rail |
| `light_rail` | Light rail / tram rail |
| `subway` | Underground metro rail |
| `tram` | Street-running tram |
| `monorail` | Monorail system |
| `narrow_gauge` | Narrow gauge railway |
| `preserved` | Heritage or museum railway |
| `disused` | Disused rail corridor |

### RoadFlagRule

Each entry in `road_flags` is a rule object:

| Field | Type | Description |
|-------|------|-------------|
| `between` | [float, float] | Optional normalized range [0.0, 1.0] along the segment; omit for entire segment |
| `values` | array of RoadFlag | One or more boolean flags active in this range |

### RoadFlag (7 values)

Boolean characteristics referenced from `RoadFlagRule.values`.

| Value | Description |
|-------|-------------|
| `is_bridge` | Segment crosses on a bridge structure |
| `is_tunnel` | Segment passes through a tunnel |
| `is_under_construction` | Road is currently being built |
| `is_abandoned` | Road is abandoned or decommissioned |
| `is_covered` | Road is covered (e.g. by a building or canopy) |
| `is_indoor` | Road is inside a building |
| `is_link` | *(deprecated)* On/off ramp or connector link; use `is_link` road class instead |

### RailFlagRule

Each entry in `rail_flags` is a rule object, identical in structure to RoadFlagRule:

| Field | Type | Description |
|-------|------|-------------|
| `between` | [float, float] | Optional normalized range [0.0, 1.0] along the segment |
| `values` | array of RailFlag | One or more boolean flags active in this range |

### RailFlag (8 values)

Boolean characteristics referenced from `RailFlagRule.values`.

| Value | Description |
|-------|-------------|
| `is_bridge` | Segment crosses on a bridge structure |
| `is_tunnel` | Segment passes through a tunnel |
| `is_under_construction` | Rail line is currently being built |
| `is_abandoned` | Rail line is abandoned or decommissioned |
| `is_covered` | Rail line is covered |
| `is_passenger` | Line carries passenger traffic |
| `is_freight` | Line carries freight traffic |
| `is_disused` | Rail corridor is disused but not fully abandoned |

### LevelRule

Each entry in `level_rules` defines a Z-order value for a portion of the segment:

| Field | Type | Description |
|-------|------|-------------|
| `between` | [float, float] | Optional normalized range [0.0, 1.0]; omit for entire segment |
| `level` | integer | Z-order value: negative = underground, 0 = ground, positive = elevated |

**Note:** `level_rules` works alongside `road_flags`/`rail_flags` — both are checked for underground detection. `is_tunnel` in flags and `level < 0` in `level_rules` are equivalent signals; ranges from both sources are unioned before exclusion.

### RoadSurface (7 values)

| Value | Description |
|-------|-------------|
| `paved` | Generic paved surface |
| `asphalt` | Asphalt or tarmac |
| `concrete` | Concrete slab |
| `cobblestone` | Cobblestone or sett |
| `unpaved` | Generic unpaved surface |
| `gravel` | Gravel or crushed stone |
| `dirt` | Dirt or earth track |

---

## Linearly-Referenced Rules

Some attributes vary along a segment's length. Overture encodes these as arrays of rule objects, each optionally scoped to a portion of the segment and/or conditional on vehicle/time context.

### Position Reference

The `between` field uses normalized [0.0, 1.0] coordinates along the segment's LineString:

```
between: [0.0, 1.0]   → entire segment
between: [0.25, 0.75] → middle half of the segment
between: [0.0, 0.5]   → first half only
```

### SpeedLimitRule

```
{
  "between": [0.0, 1.0],   // optional; defaults to entire segment
  "value": 50,             // speed limit value
  "unit": "km_h",          // "km_h" or "mph"
  "when": {                // optional conditions
    "heading": "forward",  // "forward", "backward", or omitted for both
    "vehicle": ["motor_vehicle"],
    "time": <OpeningHours expression>
  }
}
```

### AccessRestrictionRule

```
{
  "between": [0.0, 1.0],   // optional; defaults to entire segment
  "access_type": "denied", // "denied" or "allowed"
  "when": {
    "heading": "forward",
    "vehicle": ["hgv", "bus"],
    "time": <OpeningHours expression>
  }
}
```

The `when.vehicle` field accepts an array of vehicle type strings:
`motor_vehicle`, `motorcar`, `motorcycle`, `hgv`, `bus`, `bicycle`, `pedestrian`, `emergency`, `taxi`

---

## Topology Model

```
connector A ──── segment 1 ──── connector B ──── segment 2 ──── connector C
                                      │
                                  segment 3
                                      │
                                 connector D
```

- Each segment's `connectors` array lists its endpoint connector IDs in order.
- Segments sharing a connector are connected in the graph.
- `level_rules` on segments and `level` on connectors enable grade-separated crossings (e.g. bridge over tunnel) without a shared connector.

---

## See Also

- [README.md](README.md) — theme overview and common fields
- [base.md](base.md) — physical geography features
- [buildings.md](buildings.md) — building footprints and parts
