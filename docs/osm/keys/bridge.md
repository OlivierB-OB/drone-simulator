# bridge

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:bridge

## Definition
Indicates that a way (road, path, railway, etc.) crosses an obstacle on a bridge or elevated structure rather than passing through/around it at ground level.

## Data Type
String or Boolean value. Applies to ways (roads, paths, railways, waterways).

## Common Bridge Values

**Basic Bridge Types:**
- `yes` - Generic bridge (most common)
- `no` - Explicitly not a bridge (used for clarity)

**Bridge Subtypes:**
- `aqueduct` - Water-carrying bridge
- `viaduct` - Long bridge/elevated structure
- `footbridge` - Pedestrian-only bridge
- `boardwalk` - Elevated wooden structure
- `drawbridge` - Bridge with movable section
- `swing` - Swinging bridge
- `suspension` - Cable suspension bridge
- `cable_stayed` - Cable-stayed structure
- `arch` - Arch-type bridge
- `beam` - Simple beam bridge
- `cantilever` - Cantilevered structure

## Usage Notes

- Always used with the feature's main tag (highway, railway, waterway, footway, etc.)
- Essential for accurate 3D terrain visualization and pathfinding
- Combine with `layer` tag for explicit Z-ordering when bridges overlap
- Use with `height` for bridge clearance information
- Related to `tunnel` for opposite situation (below-grade)

## Related Tags
- `layer` - Z-order for 3D positioning
- `tunnel` - Opposite of bridge (below-grade crossing)
- `location` - Placement modifier (underground, overground)
- `height` - Bridge height/clearance
- `maxheight` - Maximum clearance under bridge
- `highway` / `railway` / `waterway` - Feature type
- `bridge:type` - Detailed bridge classification

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:bridge)
- [layer tag documentation](layer.md)
- [tunnel tag documentation](tunnel.md)
