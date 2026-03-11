# height

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:height

## Definition

The `height=*` key describes "the _actual_ height of a feature," indicating "how 'tall' something is" by measuring vertical distance.

For buildings specifically, height is defined as "the distance between the **top edge of the building** (including the roof, but excluding antennas, spires and other equipment) and the **lowest point at the bottom** where the building meets the terrain."

## Data Type

**Numeric values** with default unit **metres**:

| Format | Example | Notes |
|--------|---------|-------|
| Metres (default) | `height=12.5` | Decimal separator is period (.) |
| Feet+inches | `height=11'4"` | No spaces in feet/inches notation |
| Space-separated units | `height=4 m` | Space before unit (except feet/inches) |

Height is a continuous value, not discrete—use with decimal precision for accuracy.

## Common Values in Drone Simulator

Height is used on buildings, structures, and vegetation:

**Buildings:**
- Parsed as decimal metres
- Overrides default building type heights
- Example: `height=15.5` for a 15.5-meter building

**Structures:**
- Tower heights (20-50m)
- Chimney heights (40m typical)
- Mast heights (30m typical)

**Related Numeric Tags:**
- `min_height=*` — Height of lowest feature part (e.g., building base)
- `building:levels=*` — Number of above-ground floors
- `roof:height=*` — Height of roof above building

## Related Tags

- [min_height](min_height.md) — Height of bottom parts
- [building:levels](building_levels.md) — Number of above-ground levels
- [roof:height](roof_height.md) — Roof height above building
- [ele](https://wiki.openstreetmap.org/wiki/Key:ele) — Elevation above sea level (different from height)

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:height)
