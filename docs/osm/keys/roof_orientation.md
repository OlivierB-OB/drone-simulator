# roof:orientation

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:orientation

## Definition

The `roof:orientation=*` key specifies the direction of a roof ridge relative to a building's edges — whether the ridge runs along the longer side or across it. This is distinct from `roof:direction=*`, which describes the slope direction in compass terms.

Applied to areas and multipolygon relations. Requires `building=*` or `building:part=*`. Status: de facto (community standard).

## Data Type

Enumeration with two values:

| Value | Meaning |
|-------|---------|
| `along` | Ridge runs parallel to the longer building edge |
| `across` | Ridge runs perpendicular to the longer edge (parallel to the shorter side) |

## Usage Notes

- For pent roofs (skillion) and square buildings, use `roof:direction=*` instead — `roof:orientation=*` is ambiguous when there is no clear "longer" edge
- Common mistake: using cardinal directions (`north`, `south`) — those belong on `roof:direction=*`
- Common typo: `accross` — correct spelling is `across`

## Related Tags

- [roof:shape](roof_shape.md) — Roof form (required context; most relevant for `gabled`, `hipped`, etc.)
- [roof:direction](roof_direction.md) — Alternative using compass bearing or degrees
- [roof:height](roof_height.md) — Height of the roof section
- [roof:colour](roof_colour.md) — Roof color

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:orientation)
