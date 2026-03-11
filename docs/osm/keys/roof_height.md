# roof:height

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:height

## Definition

The `roof:height=*` key specifies "the height of a building's roof in meters." It represents only the roof portion of total building height, excluding antennas, spires, and mounted equipment.

Requires `building=*` or `building:part=*` on the same element. Status: de facto (widely used, not formally standardized).

## Data Type

Numeric value in meters. No unit suffix needed. Use a period as the decimal separator.

- `roof:height=4` — 4-meter roof (correct)
- `roof:height=0.8` — 0.8-meter roof (correct)
- `roof:height=4m` — incorrect (unit suffix not used)
- `roof:height=0,8` — incorrect (comma as decimal separator)

Key relationship with `height=*`: roof height is part of total height. A building tagged `height=10` with `roof:height=3` has a 7-meter facade and a 3-meter roof.

## Related Tags

- [height](height.md) — Total height from ground to highest point (includes roof)
- [roof:shape](roof_shape.md) — Roof form (gabled, dome, etc.)
- [roof:material](roof_material.md) — Roof surface material
- [roof:colour](roof_colour.md) — Roof color
- [building:part](building_part.md) — For per-part roof height

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:height)
