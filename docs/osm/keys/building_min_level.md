# building:min_level

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:min_level

## Definition

The `building:min_level=*` key indicates "the number of building levels between ground level and the bottom of a building part." It describes how many typical-height floors would fill the space below the structure if it were solid.

Used when a building or building part does not begin at ground level — for example, a bridge-like structure spanning a road, or an elevated section of a building.

## Data Type

Positive integer (natural number greater than zero). Value `0` is implied and should be omitted.

- Must be strictly less than the value of `building:levels=*`
- Decimal values (e.g., `1.5`) are incorrect — use `min_height=*` for non-integer heights
- Requires `building=*` or `building:part=*`
- Requires `building:levels=*` with value greater than 1

Examples:
- `building:min_level=1` — structure begins one level above ground
- `building:min_level=2` — two levels of open space below the structure

## Related Tags

- [building:levels](building_levels.md) — Total number of levels (required companion)
- [min_height](min_height.md) — Alternative using meters instead of level count
- [height](height.md) — Total height from ground to highest point
- [building:part](building_part.md) — Required when tagging a building section

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:min_level)
