# diameter:crown

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:diameter:crown

## Definition
Specifies the diameter of the foliage crown (leaf canopy) of a tree. Describes the width of the tree's spread when viewed from above.

## Data Type
Decimal numeric value in meters. Applied to tree nodes and wooded areas.

## Format

**Standard format:**
- `diameter:crown=10` - Diameter in meters (integer or decimal)
- `diameter:crown=8.5` - Decimal precision allowed
- `diameter:crown=4` - Small tree crown
- `diameter:crown=20` - Large tree crown

**Measurement Notes:**
- Measured horizontally from edge to edge through the center
- Includes maximum spread of foliage
- Does not include dead branches or seasonal variation

## Usage Notes

- Applied to individual tree nodes (`natural=tree`)
- Use with `height` for 3D tree proportion calculations
- Complements `circumference` for girth measurements
- Important for rendering realistic tree proportions
- May vary seasonally; use typical growing-season measurement

## Related Tags
- `height` - Tree total height in meters
- `circumference` - Tree girth at breast height (1.3m)
- `diameter` - Trunk diameter at breast height
- `leaf:type` - Foliage morphology
- `leaf:cycle` - Foliage seasonality
- `natural` - Feature type (tree)

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:diameter:crown)
- [circumference tag documentation](circumference.md)
- [diameter tag documentation](diameter.md)
- [natural tag documentation](natural.md)
