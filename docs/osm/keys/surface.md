# surface

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:surface

## Definition
Describes the physical material or surface type of a road, path, or other linear feature. Provides detail about the covering material rather than just the road class.

## Data Type
String value representing the surface material type. Applied to ways (linear features).

## Surface Material Categories

**Sealed/Paved:**
- `asphalt` - Asphalt concrete
- `concrete` - Portland cement concrete
- `paving_stones` - Blocks/pavers
- `sett` - Stone setts
- `bricks` - Brick pavers
- `metal` - Metal mesh or grid
- `wood` - Wooden boards/planks
- `stepping_stones` - Individual stones
- `tartan` - Elastic track material

**Unsealed/Unpaved:**
- `gravel` - Loose gravel
- `compacted` - Compacted earth/gravel
- `dirt` - Uncompacted earth/dirt
- `mud` - Mud surface
- `sand` - Sand
- `grass` - Living grass/turf
- `rock` - Rock/bare rock
- `ice` - Ice surface
- `snow` - Snow-covered

## Usage Notes

- Surface overrides the default color from `highway` type
- Common with `highway` and `path` tags
- Particularly important for pedestrian and unpaved routes
- Combine with `width` for realistic rendering

## Related Tags
- `highway` - Road/path type classification
- `width` - Feature width in meters
- `lanes` - Number of traffic lanes
- `tracktype` - Quality of unpaved tracks
- `access` - Access restrictions

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:surface)
- [highway tag documentation](highway.md)
