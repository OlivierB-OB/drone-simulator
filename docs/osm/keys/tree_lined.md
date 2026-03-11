# tree:lined

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:tree:lined

## Definition
Indicates that a way (road, path, etc.) has trees planted along one or both sides forming an avenue or tree-lined corridor.

## Data Type
String or Boolean value. Applied to ways (roads, paths, streets).

## Common Tree-Lined Values

**Basic Indicators:**
- `yes` - Way is tree-lined (sides unspecified)
- `no` - Explicitly not tree-lined (used for clarity)

**Directional Variants:**
- `both` - Trees on both sides of way
- `left` - Trees on left side only
- `right` - Trees on right side only

**Specification Variants:**
- `single` - Single row of trees per side
- `double` - Double row of trees per side

## Usage Notes

- Applied to ways (roads, paths, streets)
- Typically paired with `highway` tag
- Indicates visual characteristic (trees) rather than feature type
- Use with `natural=tree_row` for alternative mapping approach
- May specify tree species via `species` tag
- May specify tree arrangement via `tree:spacing` tag

## Related Tags
- `highway` - Road/path type (usually specified)
- `natural` - May use `natural=tree_row` as alternative
- `tree:spacing` - Distance between trees in meters
- `species` - Tree species specification
- `leaf:type` - Tree foliage type
- `leaf:cycle` - Tree seasonality
- `name` - Street name (context)

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:tree:lined)
- [natural tag documentation](natural.md)
- [highway tag documentation](highway.md)
