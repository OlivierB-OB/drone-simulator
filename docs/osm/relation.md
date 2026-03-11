**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Relation

# Relation

## Overview

A **relation** is a structured collection of [nodes](node.md), [ways](way.md), and other relations. It is one of the three core OSM primitives (alongside nodes and ways).

Relations are used when a feature cannot be expressed by a single node or way — for example, an area with holes, a bus route spanning many road segments, or a turn restriction at an intersection.

As of August 2025, OSM contains over 14 million relations.

## Required Tag

Every relation **must** have a `type=*` tag identifying its purpose:

```
type=multipolygon
type=route
type=boundary
type=restriction
```

## Members and Roles

A relation contains **members**, each with an optional **role** string that describes how the member participates:

| Concept | Description |
|---------|-------------|
| Member | A node, way, or relation included in the relation |
| Role | A label describing the member's function (e.g., `outer`, `inner`, `stop`, `platform`) |

Roles are relation-type-specific. An unrecognised or missing role is often treated as a generic member.

## Size Limits

| Property | Limit |
|----------|-------|
| Maximum members | 32,000 |
| Recommended maximum | ~300 members |

Large relations (thousands of members) cause performance issues for editors and processors. Prefer splitting where possible.

## Common Relation Types

### multipolygon

An area with one or more holes, or a non-contiguous area:

- `outer` role — ways forming the outer boundary
- `inner` role — ways forming holes cut out of the area

Example: a lake (`natural=water`) with islands (`inner` ways).

### route

An ordered sequence of ways and stops representing a travel route:

- Bus routes, cycle routes, hiking trails, ferry routes
- Members include: road segments (`way`), stops (`node` with role `stop`), platforms (`node`/`way` with role `platform`)

### boundary

An administrative or geographic boundary, typically a closed ring of ways:

- `admin_level=*` defines hierarchy (2=country, 4=state/region, 6=county, 8=municipality)
- Used by nominatim for place search and geocoding

### restriction

A turn prohibition at a junction:

- `from` role — the incoming way
- `via` role — the node or way at the turn point
- `to` role — the outgoing way
- `restriction=no_left_turn`, `restriction=no_u_turn`, etc.

## When to Use a Relation

Use a relation when:

- A feature requires **multiple disconnected ways** (non-contiguous landuse, split route)
- An area has **holes** (a forest with clearings, a building with a courtyard)
- Features must be **ordered** (numbered route stops)
- A **turn restriction** applies between specific road segments

Do **not** use a relation for features that a single tagged way or node can represent.

## See Also

- [node.md](node.md) — point features and way vertices
- [way.md](way.md) — linear and area features
- [OSM Relation Documentation](https://wiki.openstreetmap.org/wiki/Relation)
