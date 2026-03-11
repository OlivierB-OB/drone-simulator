# roof:colour

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:colour

## Definition

The `roof:colour=*` key indicates "the colour of the roof of a building or building part." It is used for 3D building visualization, allowing renderers to display roofs in their real-world colors.

Requires `building=*` or `building:part=*` on the same element. Status: de facto (not formally standardized).

## Data Type

Color value in one of two formats:

- **Hexadecimal**: `#RRGGBB` format preceded by `#` (e.g., `#808080` for grey)
- **Named color**: Basic color words (e.g., `grey`, `red`, `black`) — note OSM uses British spelling (`grey` not `gray`)

Common examples:
- Tile/terracotta: `#E96B39`
- Tar paper grey: `#808080`
- Copper patina: `#6EBE9F`
- Crimson: `#DC143C`
- Named values: `grey`, `red`, `black`, `brown`, `green`, `blue`

Note: Interpretation of color names differs between 3D rendering applications. Hexadecimal values are preferred for consistency. Use overcast daylight photos as color reference.

## Related Tags

- [roof:shape](roof_shape.md) — Roof form (gabled, flat, dome, etc.)
- [roof:material](roof_material.md) — Surface material (tiles, slate, metal)
- [roof:height](roof_height.md) — Height of the roof section
- [building:colour](building_colour.md) — Facade color (separate from roof)
- [building:part](building_part.md) — For per-part roof coloring

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:colour)
