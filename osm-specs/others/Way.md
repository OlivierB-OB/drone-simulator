# Way - OpenStreetMap Wiki

## Overview

A **way** represents one of the fundamental building blocks in OpenStreetMap's data structure. As described in the source material, "a way is an ordered list of nodes" that typically depicts linear geographical features such as roads, walls, or rivers.

### Key Characteristics

Ways contain between 2 and 2,000 nodes and must include at least one tag or participate in a relation. The OpenStreetMap database contains "over 1.1 billion ways" as of August 2025.

## Types of Ways

### Open Ways (Open Polylines)

Open ways feature distinct start and end nodes. The direction flows from first to last node in the database, regardless of whether the real-world feature moves bidirectionally. Common examples include most roads, streams, and railway lines.

### Closed Ways (Closed Polylines)

These ways return to their starting point, with the final node identical to the initial one. Interpretation depends on associated tags:

- `highway=*` roundabouts
- `barrier=*` surrounding walls/hedges
- Features tagged with `area=yes` are interpreted as areas

### Areas (Polygons)

Closed ways typically represent enclosed territories. Examples include:

- Parks: `leisure=park`
- Schools: `amenity=school`
- Pedestrian zones: `highway=pedestrian` + `area=yes`

## Example: Street Vector

A residential street demonstrates the data structure:

```xml
<way id="5090250">
  <nd ref="822403"/>
  <nd ref="21533912"/>
  <tag k="highway" v="residential"/>
  <tag k="name" v="Clipstone Street"/>
  <tag k="oneway" v="yes"/>
</way>
```

## Mathematical Considerations

Way segments represent geodesics—shortest paths on Earth's surface between connected nodes. This affects map rendering and distance calculations, particularly for lengthy segments using Mercator projections.
