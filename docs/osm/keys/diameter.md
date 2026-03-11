# diameter

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:diameter

## Definition
Specifies the diameter of cylindrical or circular objects, particularly tree trunks measured at breast height (DBH: 1.3 meters).

## Data Type
Decimal numeric value in centimeters or meters. Applied to tree nodes and cylindrical structures.

## Format

**Standard format:**
- `diameter=25` - Diameter in centimeters (typical for trees)
- `diameter=0.25` - Diameter in meters
- `diameter=25 cm` - Explicit unit specification
- `diameter=10 in` - Diameter in inches (less common in OSM)

**Measurement Notes:**
- Tree measurement: Breast Height Diameter (DBH) at 1.3m height
- For trunks/poles: Maximum width at middle of structure
- For pipes: Inner or outer diameter (specify with tag)

## Relationship to Circumference

The diameter can be derived from circumference (tag: `circumference`):
- diameter (cm) = circumference (cm) / π
- Example: circumference 150 cm → diameter ≈ 48 cm

## Usage Notes

- Primarily applied to tree nodes (`natural=tree`)
- Used with `height` and `diameter:crown` for complete tree profile
- For structures, complements `height` for dimensional specification
- May be measured in multiple units; prefer centimeters for consistency
- Especially useful for heritage tree tracking and biomass estimation

## Related Tags
- `circumference` - Tree girth at breast height
- `diameter:crown` - Foliage crown diameter
- `height` - Total object height
- `natural` - Feature type (tree)
- `man:made` - Man-made structure type
- `pipe_diameter` - Specific pipe diameter (pipes)

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:diameter)
- [circumference tag documentation](circumference.md)
- [diameter:crown tag documentation](diameter_crown.md)
- [height tag documentation](height.md)
