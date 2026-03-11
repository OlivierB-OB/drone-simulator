# tunnel

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:tunnel

## Definition
Indicates that a way (road, path, railway, waterway, etc.) passes through a tunnel beneath the ground or another obstacle rather than over/around it.

## Data Type
String or Boolean value. Applies to ways (roads, paths, railways, waterways).

## Common Tunnel Values

**Basic Tunnel Types:**
- `yes` - Generic tunnel (most common)
- `no` - Explicitly not a tunnel (used for clarity)

**Tunnel Subtypes:**
- `culvert` - Water-carrying tunnel/pipe
- `aqueduct_tunnel` - Aqueduct type tunnel
- `abandoned` - Abandoned/non-functional tunnel
- `disused` - Former tunnel no longer in use

## Usage Notes

- Always used with the feature's main tag (highway, railway, waterway, footway, etc.)
- Essential for accurate 3D terrain visualization and pathfinding
- Combine with `layer=-1` tag for explicit below-grade positioning
- Use with `height` for tunnel clearance information
- Related to `bridge` for opposite situation (above-grade)
- May include `tunnel:name` for specific tunnel identification

## Related Tags
- `layer` - Z-order for 3D positioning (typically -1 or lower)
- `bridge` - Opposite of tunnel (above-grade crossing)
- `location` - Placement modifier (underground, etc.)
- `height` - Tunnel height/clearance
- `maxheight` - Maximum clearance under tunnel
- `highway` / `railway` / `waterway` - Feature type
- `covered` - Covered but not fully enclosed

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:tunnel)
- [layer tag documentation](layer.md)
- [bridge tag documentation](bridge.md)
