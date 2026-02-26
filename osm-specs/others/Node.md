# Node - OpenStreetMap Wiki

## Node

A **node** is one of the core elements in the OpenStreetMap data model. It consists of a single point in space defined by its **latitude**, **longitude** and **node id**.

A third, optional dimension (altitude) can also be included: [key:ele](/wiki/Key:ele "Key:ele") (abbrev. for "elevation"). A node can also be defined as part of a particular `layer=*` or `level=*`, where distinct features pass over or under one another; say, at a bridge.

Nodes can be used to define standalone point features, but are more often used to define the shape or "path" of a **way**.

As of August 2025, OpenStreetMap contains over 10 billion nodes.

## Contents

1. [Point features](#point-features)
2. [Nodes on ways](#nodes-on-ways)
3. [Structure](#structure)
   - [Example](#example)
   - [Special cases](#special-cases)
4. [Wiki templates](#wiki-templates)

## Point Features

Nodes can be used on their own to define point features. When used this way, a node typically has at least one tag to define its purpose. Nodes may have multiple tags and/or be part of a relation. For example, a telephone box might be tagged with `amenity=telephone`, or could also include `operator=*`.

## Nodes on Ways

Many nodes form part of one or more ways, defining the shape or "path" of the way.

Where ways intersect at the same altitude, the two ways must share a node (for example, a road junction). If highways or railways cross at different heights without connecting they should _not_ share a node (e.g. highway intersection with a `bridge=*`). Where ways cross at different heights they should be tagged with different `layer=*` or `level=*` values, or be tagged with `location=*` 'overground' or 'underground'. There are some exceptions to this rule; roads across dams are by current definition required to share a node with the waterway crossing the dam.

Some nodes along a way may have tags. For example:

- `highway=crossing` + `crossing=*` to define a pedestrian crossing along a `highway=*`
- `natural=tree` to identify a lone tree on a `barrier=hedge`
- `entrance=*` to identify a doorway into a `building=*`

## Structure

| Name | Value | Description |
|------|-------|-------------|
| id | 64-bit integer number ≥ 1 | Node ids are unique between nodes. (However, a way or a relation can have the same id number as a node.) Editors may temporarily save node ids as _negative_ to denote ids that haven't yet been saved to the server. Node ids on the server are persistent, meaning that the assigned id of an existing node will remain unchanged each time data are added or corrected. Deleted node ids must not be reused, unless a former node is now undeleted. |
| lat | decimal number ≥ −90.0000000 and ≤ 90.0000000 with 7 decimal places | Latitude coordinate in degrees (North of equator is positive) using the standard WGS84 projection. Some applications may not accept latitudes above/below ±85 degrees for some projections. To get an idea of the possible precision of coordinates supported in OpenStreetMap: xkcd _Coordinate Precision_ describes the precision of 7 decimal places in latitude and longitude as "You're pointing to Waldo on a page." Do not use IEEE 32-bit floating point data type since it is limited to about 5 decimal places for the highest longitude. A 32-bit method used by the Rails port is to use an integer (by multiplying each coordinate in degrees by 1E7 and rounding it: this allows to cover all absolute signed coordinates in ±214.7483647 degrees, or a maximum difference of 429.4967295 degrees, a bit more than what is needed). For computing projections, IEEE 64 bit floating points are needed for intermediate results. The 7 rounded decimal places for coordinates in degrees define the worst error of longitude to a maximum of ±5.56595 millimetres on the Earth equator, i.e. it allows building maps with centimetric precision. With only 5 decimal places, the precision of map data would be only metric, causing severe changes of shapes for important objects like buildings, or many zigzags or angular artefacts on roads. |
| lon | decimal number ≥ −180.0000000 and ≤ 180.0000000 with 7 decimal places | Longitude coordinate in degrees (East of Greenwich is positive) using the standard WGS84 projection. Note that the geographic poles will be exactly at latitude ±90 degrees but in that case the longitude will be set to an arbitrary value within this range. |
| _tags_ | A set of key/value pairs, with unique key | See Map features for tagging guidelines. |

### Example

```xml
<node id="25496583" lat="51.5173639" lon="-0.140043" version="1" changeset="203496" user="80n" uid="1238" visible="true" timestamp="2007-01-28T11:40:26Z">
    <tag k="highway" v="traffic_signals"/>
</node>
```

### Special Cases

- Untagged unconnected node

## OpenStreetMap Data Model

**Elements**
- Node
- Way
- Relation
- (_former_: Segment)

**Tags**
- Key
- Value

**Semantic elements**
- Point
- Linear features
- Area
- Relational

**Related concepts**
- Changeset
- Preset
- Role

## Wiki Templates

- `{{NodeIconLink}}` - Adds a node icon and link - This template can be used for linking to nodes using just an icon. It saves space in example tables.
- `{{IconNode}}` - Adds a node icon.

---

**Categories**: Elements, Concepts

**Last edited**: 19 February 2026, at 15:25

**License**: Creative Commons Attribution-ShareAlike 2.0
