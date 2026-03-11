# layer

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:layer

## Definition
Specifies the vertical stacking order (Z-order) of overlapping features when multiple ways/features cross at different heights (bridges, tunnels, grade separations).

## Data Type
Integer value representing the relative height layer. Applied to ways, nodes, and areas.

## Layer Number Convention

**Standard Values:**
- `0` - Ground level (default if unspecified)
- `1`, `2`, `3`, ... - Elevated levels (bridges, overpasses, upper decks)
- `-1`, `-2`, `-3`, ... - Below-ground levels (tunnels, underpasses, basements)

**Range:**
- Typical range: -5 to +5
- Special cases may extend beyond range
- Values should be minimized to essential cases only

## Format

**Standard usage:**
- `layer=0` - Ground level (implicit default)
- `layer=1` - One level above ground (bridge/overpass)
- `layer=-1` - One level below ground (tunnel/underpass)
- `layer=2` - Two levels above (elevated structure)

## Common Values in Drone Simulator

The drone simulator uses `layer` for Z-ordering in TerrainCanvasRenderer:

**Ground-level features:**
- `layer=0` or unspecified - Roads, railways, waterways, landuse at ground level

**Bridges/Overpasses:**
- `layer=1` - Road bridges, railway viaducts
- `layer=2` - Stacked overpasses (rare)

**Tunnels/Underpasses:**
- `layer=-1` - Tunnels, underpasses, underground passages
- `layer=-2` - Deep underground (rare)

**Feature-specific usage:**
- Roads with `bridge=yes` typically have `layer=1`
- Roads with `tunnel=yes` typically have `layer=-1`

## Usage Notes

- Essential only when features actually cross/overlap at different heights
- Overuse reduces data quality; only specify when necessary
- Must be paired with `bridge` or `tunnel` for context
- Complements `location` tag for detailed placement
- Integer values only; no decimals

## Related Tags
- `bridge` - Bridge indicator (typically layer >= 1)
- `tunnel` - Tunnel indicator (typically layer <= -1)
- `location` - Placement/orientation modifier
- `height` - Vertical distance measurement
- `level` - Building floor specification
- `man:made` - Structure classification

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:layer)
- [bridge tag documentation](bridge.md)
- [tunnel tag documentation](tunnel.md)
- [location tag documentation](location.md)
- [Canvas Rendering Documentation](../../visualization/canvas-rendering.md)
