**OSM Wiki:** https://wiki.openstreetmap.org/wiki/3D_tagging

# 3D Tagging

A special form of micromapping focused on collecting comprehensive information to create realistic 3D representations of geographic areas.

## Categories of 3D Elements

### Buildings
- Simple 3D buildings schema implementation

### High Infrastructure
- Chimneys
- Towers
- Power poles
- Bridges

### City Furniture
- Benches
- Street lamps
- Vending machines
- Walls
- Power cabinets

### Nature
- Trees
- Hedges

## 3D Models Tagging Reference

### Building Elements

| Element | Main Tag | 3D Attributes | Type |
|---------|----------|---------------|------|
| Building | `building=yes` or `building:part=yes` | `height=*`, `min_height=*`, `building:levels=*`, `building:min_level=*`, `building:material=*`, `building:colour=*` | Node |
| Roof | `building=roof` | `roof:height=*`, `roof:shape=*`, `roof:orientation=*`, `roof:material=*`, `roof:colour=*`, `roof:direction=*` | Area/Relation |
| Entrance | `entrance=*` | `height=*`, `min_height=*`, `width=*`, `entrance:type=*` | Node |
| Window | (no main tag) | `height=*`, `min_height=*`, `width=*`, `window:type=*` | Node |
| Balcony | (no main tag) | `height=*`, `min_height=*`, `width=*`, `balcony:type=*` | Node |
| Steps | `highway=steps` | `height=*`, `min_height=*`, `material=*`, `width=*` | Way |
| Ramp | `highway=steps` + `ramp=yes` | `height=*`, `min_height=*`, `material=*`, `width=*` | Way |

### Artwork

| Element | Main Tag | 3D Attributes | Type |
|---------|----------|---------------|------|
| Mural | `tourism=artwork` + `artwork_type=mural` | `height=*`, `min_height=*`, `width=*` | Node |
| Sculpture | `tourism=artwork` + `artwork_type=sculpture` | `height=*`, `min_height=*`, `material=*`, `direction=*` | Node |
| Statue | `tourism=artwork` + `artwork_type=statue` | `height=*`, `min_height=*`, `material=*`, `direction=*` | Node |
| Obelisk | `man_made=obelisk` | `height=*`, `min_height=*`, `obelisk:height=*`, `material=*`, `colour=*` | Node/Area |
| Cross | `man_made=cross` | `height=*`, `min_height=*`, `direction=*`, `material=*`, `colour=*` | Node/Area |

### Street Furniture & Amenities

| Element | Main Tag | 3D Attributes | Type |
|---------|----------|---------------|------|
| Street Lamp | `highway=street_lamp` | `height=*`, `lamp_type=*`, `lamp:shape=*`, `lamp:tilt=*`, `support=pole` | Node |
| Bench | `amenity=bench` | `direction=*` | Node |
| Clock | `amenity=clock` | `height=*`, `min_height=*`, `width=*`, `direction=*` | Node |
| Fountain | `amenity=fountain` | `height=*`, `min_height=*` | Node/Area |
| Bicycle Parking | `amenity=bicycle_parking` | `direction=*` | Node |
| Vending Machine | `amenity=vending_machine` | `direction=*` | Node |

### Barriers & Natural Elements

| Element | Main Tag | 3D Attributes | Type |
|---------|----------|---------------|------|
| Fence | `barrier=fence` | `height=*` | Way |
| Wall | `barrier=wall` | `height=*`, `material=*` | Way/Area |
| Tree | `natural=tree` | `height=*` | Way |
| Chimney | `man_made=chimney` | `height=*`, `diameter:top=*`, `diameter:bottom=*` | Node |

### Transport Features

| Element | Main Tag | Notes | Type |
|---------|----------|-------|------|
| Bus Stop | `highway=bus_stop` | Stop sign board perpendicular to way | Node |
| Platform | `public_transport=platform` | Platform parallel to way | Node |

## Related Resources

- Simple 3D Buildings reference
- 3D development/tagging documentation
- Stairs modelling guidelines
- JOSM Kendzi3D plugin
