# location

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:location

## Definition
Specifies the physical or spatial location/placement of a feature relative to its context (e.g., underground, on a roof, or within another structure).

## Data Type
String value representing the location classification. Applied to various features (ways, nodes, areas).

## Common Location Values

**Vertical Positioning:**
- `underground` - Below ground level/underground
- `overground` - Above ground level (above street level)
- `above` - On top of another structure
- `below` - Below another structure
- `underwater` - Submerged underwater
- `indoor` - Within an enclosed building space
- `rooftop` - On a rooftop
- `air` - Suspended in air (for cables, antennas)

**Specific Placements:**
- `on` - On top of (structure modifier)
- `under` - Under/beneath
- `inside` - Inside another structure
- `outside` - External to structure
- `embedded` - Embedded within another structure

## Usage Notes

- Applied to infrastructure and feature elements
- Often combined with `layer` for explicit Z-ordering
- Particularly useful for underground/overground distinction
- Complements `level` for vertical positioning within buildings
- May be used with utilities (power, water, gas lines)

## Related Tags
- `layer` - Z-order for 3D positioning
- `level` - Building floor specification
- `bridge` - Bridge indicator (above grade)
- `tunnel` - Tunnel indicator (below grade)
- `height` - Vertical dimension
- `man:made` - Man-made structure type
- `barrier` - Barrier type and placement

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:location)
- [layer tag documentation](layer.md)
- [level tag documentation](level.md)
- [bridge tag documentation](bridge.md)
- [tunnel tag documentation](tunnel.md)
