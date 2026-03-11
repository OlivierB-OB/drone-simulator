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

## Common Values in Drone Simulator

The drone simulator uses `surface` tags for road rendering via `surfaceColors` in config.ts:

**Asphalt/sealed (color #777060):**
- asphalt

**Light paving (color #ccccbb):**
- concrete, concrete:plates, concrete:lanes
- paving_stones, paving_stones:lanes
- clay, tartan, artificial_turf, acrylic, rubber, carpet, plastic

**Stone (color #b0a090):**
- sett, unhewn_cobblestone

**Brick (color #c87060):**
- bricks

**Metal (color #909090):**
- metal, metal_grid

**Natural (color #b08860/#b09870):**
- wood, stepping_stones, woodchips

**Unpaved/gravel (color #c4a882):**
- compacted, fine_gravel, gravel, pebblestone, shells

**Dirt (color #a88060):**
- dirt, mud

**Natural surfaces:**
- grass (#90b860), sand (#e8d89a), rock (#b8a888), snow/ice (#e8f0ff)

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
- [Canvas Rendering Documentation](../../visualization/canvas-rendering.md)
