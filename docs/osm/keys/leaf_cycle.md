# leaf:cycle

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:leaf:cycle

## Definition
Specifies the seasonality pattern of tree foliage. Indicates whether a tree loses its leaves seasonally (deciduous) or retains them year-round (evergreen).

## Data Type
String value representing the foliage seasonality type. Applied to tree nodes and wooded areas/ways.

## Leaf Cycle Classifications

**Primary Types:**
- `deciduous` - Tree loses leaves seasonally (typically autumn)
- `evergreen` - Tree retains leaves year-round
- `semi_evergreen` - Tree retains some leaves while shedding others

**Specialized Types:**
- `semi-deciduous` - Variant of semi-evergreen behavior

## Format

**Standard usage:**
- `leaf:cycle=deciduous` - Trees that shed leaves seasonally
- `leaf:cycle=evergreen` - Trees with persistent foliage
- `leaf:cycle=semi_evergreen` - Mixed retention pattern

**Combined with foliage type:**
- Often paired with `leaf:type` tag for complete classification

## Usage Notes

- Applied to individual tree nodes and wooded areas
- Should always be paired with `leaf:type` for complete information
- Usually paired with `natural=tree` or `natural=wood`
- Important for rendering seasonal variations
- Deciduous forests change appearance throughout the year

## Related Tags
- `leaf:type` - Tree foliage morphology (broadleaf/coniferous)
- `natural` - Natural feature type (tree, wood, forest)
- `species` - Specific tree species
- `height` - Tree height in meters
- `diameter:crown` - Crown diameter for individual trees
- `circumference` - Tree girth measurement

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:leaf:cycle)
- [leaf:type tag documentation](leaf_type.md)
- [natural tag documentation](natural.md)
