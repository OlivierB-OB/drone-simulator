# building:part

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:part

## Definition

The `building:part=*` key marks a distinct section of a building that has different attributes from other sections — for example, a tower wing with more floors, or a lower annex with a different roof shape. It enables detailed 3D building modeling of complex structures.

Applied to closed ways or multipolygon relations. Status: de facto standard (widely used).

## Data Type

Enumeration with a small set of documented values:

| Value | Description |
|-------|-------------|
| `yes` | Generic building part with differing attributes |
| `roof` | Roof-only structure (canopy, awning) with no vertical walls |
| `porch` | Covered entrance |
| `balcony` | Overhanging residential structure |
| `column` | Support column for elevated sections |
| `corridor` | Covered connection between buildings |
| `staircase` | Staircase structure |
| `steps` | Stadium-style stepped section |

Usage rules:
- One area should be tagged `building=*` to outline the full footprint; `building:part=*` areas fit within it
- The parent `building=*` should carry the maximum `height=*` and `building:levels=*` across all parts
- Some 3D renderers suppress the parent outline when parts are present — ensure complete coverage

## Related Tags

- [building](building.md) — Required parent outline tag
- [building:levels](building_levels.md) — Number of levels in this part
- [height](height.md) — Total height of this part
- [min_height](min_height.md) — Height above ground where this part begins
- [building:min_level](building_min_level.md) — Level count below this part
- [building:colour](building_colour.md) — Facade color for this part
- [roof:shape](roof_shape.md) — Roof shape for this part

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:part)
