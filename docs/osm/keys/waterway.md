# waterway

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:waterway

## Definition
Specifies the type of water feature mapped as a linear way (flowing water like rivers/streams, channels, and waterway infrastructure). Complements the `water` tag for area features.

## Data Type
String value representing the waterway type classification. Applied to ways (linear features).

## Waterway Classifications

**Flowing Water:**
- `river` - Large flowing water body
- `stream` - Small flowing water feature
- `tidal_channel` - Channel affected by tidal forces
- `rivulet` - Very small stream

**Artificial Channels:**
- `canal` - Artificial waterway for transport/drainage
- `ditch` - Drainage ditch
- `drain` - Small drainage channel

**Infrastructure:**
- `dam` - Barrier structure across water
- `weir` - Low water-control structure
- `lock_gate` - Canal lock mechanism
- `waterfall` - Cascading water

**Specialized:**
- `fish_pass` - Fish ladder/passage
- `rapids` - Fast-flowing section
- `harbour` - Harbor/port area

## Usage Notes

- Applied to ways (linear features only)
- River/stream centerline typically mapped as a way
- Can be combined with `water=*` for area mapping
- Use with `layer` and `bridge`/`tunnel` for grade separation
- `level` indicates underwater/elevated sections

## Related Tags
- `water` - Water body type (for areas)
- `natural` - Natural feature classification
- `width` - Actual waterway width in meters
- `depth` - Water depth
- `layer` - Z-order for overlapping features
- `bridge` - Bridge crossing indicator
- `tunnel` - Tunnel indicator
- `name` - Waterway name
- `flow` - Water flow direction

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:waterway)
- [water tag documentation](water.md)
- [natural tag documentation](natural.md)
