# min_height

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:min_height

## Definition

The `min_height=*` key indicates "the height above ground at which a feature begins." It is primarily used for 3D building data to represent elevated structures — for example, a building section that starts 4 meters above ground because it spans a passageway.

Applied to nodes, ways, areas, and relations.

## Data Type

Numeric value in meters (default unit for height keys). Use a period as the decimal separator.

Examples:
- `min_height=4` — feature begins 4 meters above ground
- `min_height=2.5` — feature begins 2.5 meters above ground

Important distinction:
- `min_height=*` — where the feature **starts** (bottom of the structure)
- `height=*` — the **total height** from ground to the top

Do not reduce `height=*` by the min_height offset. A structure that begins at 3 m and ends at 10 m is tagged `min_height=3` + `height=10`, not `height=7`.

## Related Tags

- [height](height.md) — Total height from ground to highest point
- [building:min_level](building_min_level.md) — Level-count alternative to min_height
- [building:levels](building_levels.md) — Number of levels
- [building:part](building_part.md) — Used together for elevated building parts

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:min_height)
