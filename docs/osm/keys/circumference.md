# circumference

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:circumference

## Definition
Specifies the circumference (perimeter) of a tree trunk at breast height (standardized at 1.3 meters above ground). Used to estimate tree age and biomass.

## Data Type
Decimal numeric value in centimeters or meters. Applied to tree nodes.

## Format

**Standard format:**
- `circumference=100` - Circumference in centimeters (typical unit)
- `circumference=1` - Circumference in meters (less common)
- `circumference=150 cm` - Explicit unit specification

**Conversion Notes:**
- Standard forestry measurements: centimeters
- Conversion: diameter = circumference / π
- Breast Height (DBH): Standard measurement at 1.3m above ground

## Usage Notes

- Measured at breast height (DBH): 1.3 meters above ground
- Standard forestry measurement for tree monitoring
- Use with `height` and `diameter:crown` for complete tree profile
- Helps estimate tree age and ecological value
- Primarily used for individual trees (`natural=tree`)

## Related Tags
- `diameter` - Trunk diameter at breast height
- `diameter:crown` - Foliage crown spread diameter
- `height` - Total tree height
- `leaf:type` - Tree foliage type
- `natural` - Feature type (tree)
- `ref:gnis` - Tree identifier/registry reference

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:circumference)
- [diameter tag documentation](diameter.md)
- [diameter:crown tag documentation](diameter_crown.md)
- [natural tag documentation](natural.md)
