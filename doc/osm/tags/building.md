# building

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building

## Definition

The `building=*` key marks structures as buildings in OpenStreetMap. It's used to identify "the outline of a building, a man-made structure with a roof, standing more or less permanently in one place."

The most basic usage is `building=yes`, but more specific values classify architectural types. Note that building type represents the structure itself, not its current use—a former hospital is still tagged `building=hospital` even if repurposed, while active functions use separate tags like `amenity=hospital`.

## Data Type

Enumeration with 191+ documented building types organized into categories:
- **Residential**: house, apartment, detached, terrace, semi, bungalow
- **Commercial**: office, retail, warehouse, supermarket, department_store
- **Religious**: church, mosque, temple, cathedral, synagogue
- **Civic**: school, hospital, library, townhall, fire_station
- **Agricultural**: barn, farm, greenhouse, stable
- **Industrial**: factory, manufacturing, industrial
- **Other**: garage, shed, carport, container, kiosk, hut

## Common Values in Drone Simulator

The following 16 building types are used with default heights (overridden by `height=*` tag if present):

- `residential` (6m) — Standard residential properties
- `commercial` (6m) — Commercial buildings
- `industrial` (9m) — Industrial structures
- `office` (15m) — Office buildings
- `retail` (4m) — Retail/shop buildings
- `apartments` (12m) — Multi-unit residential
- `detached` (6m) — Single-family detached houses
- `house` (6m) — Generic houses
- `terrace` (6m) — Terraced/row houses
- `warehouse` (8m) — Warehouse buildings
- `school` (6m) — School buildings
- `hospital` (10m) — Hospital buildings
- `church` (12m) — Church buildings
- `cathedral` (20m) — Cathedral buildings
- `garage` (3m) — Garage/carport structures
- `shed` (2.5m) — Shed/small storage structures

## Related Tags
- [building:type](building_type.md) — Building classification
- [building:part](building_part.md) — Building component
- [height](height.md) — Total height
- [roof:shape](roof_shape.md) — Roof form

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building)
