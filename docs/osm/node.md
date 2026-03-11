**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Node

# Node

## Overview

A **node** is a single point in space defined by a latitude and longitude. It is one of the three core OSM primitives (alongside [ways](way.md) and [relations](relation.md)).

As of August 2025, OSM contains over 10 billion nodes.

## Coordinates

Nodes use the **WGS84** geographic coordinate system:

| Property | Range | Precision |
|----------|-------|-----------|
| Latitude | −90° to +90° | Up to 7 decimal places (~1 cm accuracy) |
| Longitude | −180° to +180° | Up to 7 decimal places (~1 cm accuracy) |

## Two Uses

Nodes serve two distinct roles in OSM:

### 1. Standalone Point Features

A node with tags represents a discrete geographic feature:

- `amenity=telephone` — a phone box
- `natural=tree` — an individual tree
- `highway=traffic_signals` — traffic lights at an intersection
- `shop=bakery` — a small shop (when the building footprint is not mapped)

### 2. Way Shape Components

Untagged nodes form the vertices of [ways](way.md). They define the geometry of roads, rivers, building outlines, and other linear or area features. These nodes carry no tags of their own.

## Special Node Cases

Some nodes sit along ways but carry their own tags:

- **Pedestrian crossings** — `highway=crossing` on a node within a road way
- **Building entrances** — `entrance=yes` on a node along a building outline
- **Trees on hedges** — `natural=tree` on a node within a `barrier=hedge` way
- **Gates on paths** — `barrier=gate` on a node within a `highway=path` way

## Intersections

When two ways share a node, they intersect at that point. Rules:

- **Same altitude**: ways crossing at ground level share an identical node (same ID)
- **Different altitudes**: ways that cross without connecting (e.g., a bridge over a road) do **not** share a node; use `layer=*` or `level=*` to indicate vertical separation

## Technical Properties

| Property | Details |
|----------|---------|
| ID | 64-bit integer, globally unique |
| Tags | Key-value pairs (any number) |
| Version | Incremented on each edit |
| Coordinates | Stored as integers (nanodegrees) internally |

## Optional Attributes

- `ele=*` — elevation above sea level in metres
- `layer=*` — relative vertical position for crossings
- `level=*` — floor number inside a building

## See Also

- [way.md](way.md) — ordered list of nodes forming roads, rivers, and areas
- [relation.md](relation.md) — structured collection of nodes, ways, and relations
- [OSM Node Documentation](https://wiki.openstreetmap.org/wiki/Node)
