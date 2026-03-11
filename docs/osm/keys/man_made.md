# man_made

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:man_made

## Definition
Specifies structures and infrastructure that are primarily man-made (artificial). Covers buildings, towers, monuments, and other constructed features not classified as buildings.

## Data Type
String value representing the man-made structure type. Applied to nodes, ways, and areas.

## Common Man-Made Structure Types

**Towers and Structures:**
- `tower` - General tower structure
- `mast` - Antenna or transmission mast
- `communications_tower` - Communications infrastructure
- `water_tower` - Elevated water storage tower
- `chimney` - Chimney/smokestack
- `lighthouse` - Lighthouse structure
- `crane` - Crane equipment
- `power_tower` - High voltage transmission tower
- `power_pole` - Utility pole
- `aerialway_pylon` - Aerial tramway support

**Infrastructure:**
- `silo` - Grain/storage silo
- `storage_tank` - Storage tank
- `monument` - Monument
- `memorial` - Memorial structure
- `fountain` - Decorative fountain
- `bridge` - Bridge (may also use bridge=yes)

**Boundary/Perimeter:**
- `fence` - Fence structure
- `wall` - Wall structure
- `gate` - Gate entrance
- `barrier` - Generic barrier (see barrier tag)

**Specialized:**
- `flagpole` - Flag pole
- `pier` - Pier structure
- `dock` - Dock/wharf

## Usage Notes

- Applied to various geometry types (nodes for points, ways/areas for structures)
- Often combined with `height` or `levels` for dimension data
- Use with `material` tag for construction material info
- May include `name` for identification
- Complements `power` and `barrier` tags for specialized structures

## Related Tags
- `height` - Structure height in meters
- `material` - Construction material
- `power` - Power infrastructure type (for electrical structures)
- `barrier` - Barrier type (for boundary structures)
- `diameter` - Diameter measurement
- `name` - Structure name
- `layer` - Z-ordering for overlapping features

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:man:made)
- [power tag documentation](power.md)
- [material tag documentation](material.md)
- [barrier tag documentation](barrier.md)
