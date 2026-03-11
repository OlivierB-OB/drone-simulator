# natural

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:natural

## Definition
Marks natural features and areas of natural interest that are not primarily man-made. Covers vegetation, geological, and water features.

## Data Type
String value representing the natural feature type. Applied to areas/multipolygons, ways, and sometimes nodes.

## Natural Feature Types

**Vegetation Areas:**
- `wood` - Wooded area/forest
- `forest` - Forest (synonym for wood)
- `tree_row` - Linear row of trees
- `scrub` - Shrubland/bushes
- `grassland` - Open grassland
- `heath` - Heathland
- `fell` - Barren fell/mountain

**Water/Wetland:**
- `water` - Natural water area
- `wetland` - Marsh, bog, or swamp
- `beach` - Sandy/pebbly beach
- `reef` - Coral or rock reef

**Geological:**
- `bare_rock` - Exposed bedrock
- `scree` - Rocky slope/talus
- `glacier` - Glaciated area
- `lava_field` - Volcanic lava field

**Singular Features:**
- `tree` - Individual tree (nodes)
- `stone` - Notable stone (nodes)
- `cave_entrance` - Cave opening (nodes)

## Usage Notes

- Applied to areas and ways describing natural boundaries
- Individual trees use `tree` value on nodes
- Combines with `leaf_type`, `leaf_cycle` for vegetation detail
- Often overlaps with `landuse` classification
- Can include `height` for vegetation measurement

## Related Tags
- `leaf_type` - Tree foliage type (deciduous/coniferous/mixed)
- `leaf_cycle` - Foliage seasonality (deciduous/evergreen)
- `landuse` - Land use classification (may be primary)
- `leisure` - Recreation area specification
- `tree_lined` - Tree-lined ways indicator
- `diameter_crown` - Tree crown diameter
- `circumference` - Tree circumference
- `height` - Vegetation height in meters

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:natural)
- [leaf_type tag documentation](leaf_type.md)
- [leaf_cycle tag documentation](leaf_cycle.md)
- [landuse tag documentation](landuse.md)
