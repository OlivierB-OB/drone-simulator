**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Way

# Way

## Overview

A **way** is an ordered list of [nodes](node.md) that defines a linear feature or an area boundary. It is one of the three core OSM primitives (alongside [nodes](node.md) and [relations](relation.md)).

As of August 2025, OSM contains over 1.1 billion ways.

## Constraints

| Property | Limit |
|----------|-------|
| Minimum nodes | 2 |
| Maximum nodes | 2,000 |

Ways exceeding 2,000 nodes must be split. Longer routes (motorways, rivers) are represented as sequences of connected ways.

## Types

### Open Way

First and last nodes differ. Represents a linear feature:

- `highway=residential` — a road segment
- `waterway=stream` — a stream
- `barrier=fence` — a fence line

### Closed Way

First and last nodes are the same (the way loops back to its start). Represents either:

- A **loop** — a circular road (`junction=roundabout`), a closed wall
- An **area** — when tags indicate a 2D feature (see Area Detection below)

### Area / Polygon

A closed way interpreted as a filled area:

- `landuse=park` — a park boundary
- `building=yes` — a building footprint
- `leisure=pitch` — a sports pitch

## Direction

Every way has a direction determined by node order (from the first node to the last). This matters for:

- **One-way roads** — `oneway=yes` means traffic flows in node order
- **Waterways** — water flows in node order
- **Coastlines** — land is always to the left of the way direction

Bidirectional roads also have a direction, used for `lanes:forward=*` / `lanes:backward=*`.

## Area Detection

Renderers and processors determine whether a closed way is an area by:

1. **Tags** — certain keys imply areas: `building`, `landuse`, `leisure`, `natural`, `amenity`
2. **Explicit flag** — `area=yes` forces area interpretation when tags are ambiguous
3. **Exclusion** — `area=no` forces linear interpretation (e.g., a circular road that is not an area)

## Common Tags

| Tag | Purpose |
|-----|---------|
| `highway=*` | Road or path type |
| `waterway=*` | River, stream, or canal |
| `barrier=*` | Fence, wall, hedge |
| `natural=*` | Natural feature (wood, water, coastline) |
| `landuse=*` | Land use classification |
| `building=*` | Building footprint |

## See Also

- [node.md](node.md) — point features and way vertices
- [relation.md](relation.md) — groups of ways forming complex features
- [highways.md](highways.md) — full highway classification
- [OSM Way Documentation](https://wiki.openstreetmap.org/wiki/Way)
