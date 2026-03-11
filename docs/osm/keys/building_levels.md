# building:levels

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:levels

## Definition

The `building:levels` tag represents "the **actual** number of above-ground non-roof levels (= floors = storeys) of a building."

Underground levels and roofs don't count toward this value. This is used in 3D modeling to determine building height when the `height` tag is not specified (standard assumption: 3 meters per floor).

## Data Type

**Positive integers only** — no fractional values. The value represents the actual above-ground floor count.

| Value | Meaning | Default Height |
|-------|---------|-----------------|
| 1 | Single ground level | 3m |
| 2 | Two-story building | 6m |
| 3 | Three-story building | 9m |
| 4-5 | Mid-rise building | 12-15m |
| 6+ | High-rise building | 18m+ |

## Related Tags

- [height](height.md) — Precise height in meters (takes precedence)
- [min_height](min_height.md) — Height to lowest feature
- [building:min_level](building_min_level.md) — Lowest floor number
- [roof:levels](https://wiki.openstreetmap.org/wiki/Key:roof:levels) — Number of roof sections
- [building:levels:underground](https://wiki.openstreetmap.org/wiki/Key:building:levels:underground) — Basement levels

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:levels)
