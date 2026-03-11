**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Highways

# Highways

## Overview

The `highway=*` tag describes roads, paths, cycletracks, and other recognized land routes. In OpenStreetMap, "highway" uses British English terminology, meaning any improved thoroughfare for vehicles, cyclists, pedestrians, or horse riders — but not trains.

> "A highway in OpenStreetMap is any road, route, way, or thoroughfare on land which connects one location to another"

## Road Classification

### Roads and Tracks

Roads are classified by importance within the network:

| Classification | Tag |
|---|---|
| Motorways | `highway=motorway`, `highway=motorway_link` |
| Trunk roads | `highway=trunk`, `highway=trunk_link` |
| Primary | `highway=primary`, `highway=primary_link` |
| Secondary | `highway=secondary`, `highway=secondary_link` |
| Tertiary | `highway=tertiary`, `highway=tertiary_link` |
| Unclassified | `highway=unclassified` |
| Residential | `highway=residential` |
| Service roads | `highway=service` |
| Living streets | `highway=living_street` |
| Tracks | `highway=track` |
| Unknown classification | `highway=road` |

### Pedestrian Routes, Paths & Cycle Tracks

| Type | Tag |
|---|---|
| Pedestrian | `highway=pedestrian` |
| Cycleway | `highway=cycleway` |
| Footway | `highway=footway` |
| Bridleway | `highway=bridleway` |
| Generic path | `highway=path` |
| Informal paths | `informal=yes` |

## Additional Tags

### Names and References

- `name=*` - Road name
- `ref=*` - Route reference (semicolon-delimited for multiple: `ref=I 39;US 51`)
- `official_name=*` - Official designation
- `old_name=*` - Historical names

### Restrictions and Limits

- `maxspeed=*` - Speed limit
- `maxheight=*`, `maxwidth=*`, `maxweight=*` - Vehicle restrictions
- `foot=no` - No pedestrian access
- `bicycle=no` - No bicycle access

### Physical Characteristics

| Attribute | Tag |
|---|---|
| Surface | `surface=*` |
| Track quality | `tracktype=*` (grade1–grade5) |
| Width | `width=*` (meters) |
| Lighting | `lit=yes`/`lit=no` |
| Traffic calming | `traffic_calming=*` |

### Lanes

- `lanes=*` - Total number of lanes
- `lanes:forward=*`, `lanes:backward=*` - Directional lanes
- `lanes:bus:forward=*`, `lanes:taxi:backward=*` - Specialized lanes
- `turn:lanes=*` - Turn restrictions (e.g., `turn:lanes=left;through|right`)

### Parking

- `parking:left=*`, `parking:right=*`, `parking:both=*` - Street parking configuration

### Cycle Lanes and Sidewalks

- `cycleway=*` - Dedicated cycle facilities
- `sidewalk=*` - Footway/pavement information

### Crossing Points and Barriers

- `crossing=*` - Crossing type (traffic_signals, uncontrolled, island, unmarked)
- `barrier=*` - Physical restrictions (cycle_barrier, gate, toll_booth, etc.)
- `ford=*` - Water crossings without bridges

## Construction and Proposed Roads

- `highway=construction` + `construction=*` - Roads under construction
- `highway=proposed` + `proposed=*` - Planned roads

## Bridges and Tunnels

Split ways at bridge/tunnel boundaries:

- `bridge=yes` or `bridge=viaduct`
- `tunnel=yes`
- `layer=*` - Vertical positioning (1 for bridges, -1 for tunnels)
- `embankment=*` or `cutting=*` - Grade separation

## Carriageways

A carriageway is road width unrestricted by physical barriers:

- **Single carriageway**: One OSM way (regardless of lane count)
- **Multiple carriageways**: Separate ways for each (typically one-way dual carriageways)

## Junctions

- Simple junctions use shared nodes
- `highway=traffic_signals` - Traffic light nodes
- `highway=mini_roundabout` - Painted mini-roundabouts
- `junction=roundabout` - Circular ways for larger roundabouts
- Turn restrictions use `Relation:restriction` for routing services
