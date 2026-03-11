**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings

# Simple 3D Buildings

## Overview

The Simple 3D Buildings schema provides a standardized approach for tagging basic 3D attributes of buildings in OpenStreetMap. This method was established at the 2nd 3D Workshop Garching and describes building volumes using two primary area types: building outlines and building parts.

## How to Map

### Building Outlines

Building outlines represent the total land area covered by a building. They are tagged as closed ways or multipolygons with `building=*`. Key characteristics:

- Represents the building footprint
- Must contain all building attributes (address, name, height, operator, etc.)
- Provides backward compatibility with 2D rendering software
- When building parts exist, the outline is not used for 3D rendering

### Building Parts

Individual sections with different physical characteristics are mapped as separate areas within the outline using `building:part=*`. Guidelines:

- Value is typically `yes` but can match any `building=*` value
- Fill the entire building outline with `building:part` areas
- Tag each section with respective height and attributes
- Avoid overlapping 3D volumes (2D footprints may overlap, but 3D should not)

### Underground Parts

Use `building:part=*` with `layer=-1` for sections extending below ground beyond the visible footprint. Create a `type=building` relation including all parts.

## Tagging Reference

### Both Facades and Roof

| Tag | Purpose |
|-----|---------|
| `height=*` | Distance from ground to roof top (excluding antennas) |
| `min_height=*` | Height below building structure |

### Facades Only

| Tag | Purpose |
|-----|---------|
| `building:levels=*` | Number of above-ground floors |
| `building:min_level=*` | Skipped levels (e.g., for elevated sections) |
| `building:material=*` | Outer facade material |
| `building:colour=*` | Facade color |

### Roof Only

| Tag | Purpose |
|-----|---------|
| `roof:shape=*` | Shape type (flat, gabled, hipped, pyramidal, dome, etc.) |
| `roof:height=*` | Height of roof structure |
| `roof:levels=*` | Floors within roof |
| `roof:angle=*` | Roof inclination in degrees |
| `roof:colour=*` | Dominant roof color |
| `roof:material=*` | Roof material composition |
| `roof:orientation=*` | Ridge direction (along/across) |
| `roof:direction=*` | Direction of main roof face |

## Roof Shapes

Standard shapes include: `flat`, `skillion`, `gabled`, `half-hipped`, `hipped`, `pyramidal`, `gambrel`, `mansard`, `dome`, `onion`, `round`, `saltbox`.

## Software Support

**Editing Tools:** Kendzi3d (JOSM plugin), Urban Eye 3D, Rapid

**Map Applications:** F4 Map, OSM2World, OSMBuildings, Mapbox services, Cesium OSM Buildings

**Frameworks:** Mapbox SDKs, Carto Mobile SDK, CartoType, VTM

**Design Tools:** blender-osm, Mapbox Studio, Maputnik

## Important Notes

- If tagging new buildings, try to give a `height` value rather than relying solely on level counts
- Building outline attributes apply to the entire structure
- 2D renderers ignore detailed `building:part` attributes
