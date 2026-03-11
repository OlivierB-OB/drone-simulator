# roof:direction

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:direction

## Definition

The `roof:direction=*` key specifies "the orientation of a roof surface as the direction of the roof slope" — meaning the direction water runs off, viewed from ridge to eaves. This is distinct from `roof:orientation=*`, which describes the ridge direction relative to building edges.

Applied to areas and multipolygon relations. Requires `building=*` or `building:part=*`.

## Data Type

Direction value in one of two formats:

- **Cardinal/intercardinal abbreviations**: `N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`, `ESE`, etc.
- **Degrees**: 0–360, where 0° = North, 90° = East (clockwise)

Examples:
- `roof:direction=N` — roof slopes toward north (water runs northward)
- `roof:direction=135` — roof slopes toward southeast

## Usage Notes

- Best suited for pent roofs (skillion) and square buildings where `roof:orientation=*` is ambiguous
- For gabled roofs with two opposing slope directions, either direction value is acceptable
- Pyramidal roofs do not need this tag (they slope equally in all directions)
- Common mistake: using `north` instead of `N` — use abbreviated compass points

## Related Tags

- [roof:shape](roof_shape.md) — Roof form (required context)
- [roof:orientation](roof_orientation.md) — Simpler alternative (along/across) for ridge direction
- [roof:height](roof_height.md) — Height of the roof section
- [roof:colour](roof_colour.md) — Roof color

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:direction)
