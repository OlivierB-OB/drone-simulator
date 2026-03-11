# level

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:level

## Definition
Specifies which floor or level of a building (or multi-level structure) a feature is located on. Used for indicating underground levels (negative), ground level (0), and upper levels (positive).

## Data Type
Integer value representing the level number. Applied to nodes, ways, and areas within multi-level buildings.

## Level Number Format

**Level Numbering Convention:**
- `0` - Ground level (entry floor)
- `1`, `2`, `3`, ... - First floor, second floor, etc. (above ground)
- `-1`, `-2`, `-3`, ... - Basement, sub-basement, etc. (below ground)

**Multiple Levels:**
- `0;1` - Feature spans both ground and first floor
- `0;1;2` - Feature spans ground through second floor
- `0-3` - Range notation for features spanning multiple floors

## Usage Notes

- Complementary to `building:min_level` for explicit level positioning
- Essential for complex buildings with underground/multi-level sections
- Used with `building:part` to organize complex building structures
- Ground level is always `0` (not `1` as in some countries)
- OSM convention: uses ground floor reference (0), not architectural floor counting

## Related Tags
- `building:part` - Building component requiring level specification
- `building:min_level` - Lowest floor number for a building
- `building:levels` - Total number of above-ground floors
- `height` - Vertical distance measurement
- `min_height` - Height above ground reference
- `indoor` - Indoor positioning information

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:level)
- [building:part tag documentation](building_part.md)
- [building:min_level tag documentation](building_min_level.md)
