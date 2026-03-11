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

## Related Tags
- [building:type](building_type.md) — Building classification
- [building:part](building_part.md) — Building component
- [height](height.md) — Total height
- [roof:shape](roof_shape.md) — Roof form

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building)
