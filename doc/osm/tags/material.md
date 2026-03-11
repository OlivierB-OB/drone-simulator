# material

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:material

## Definition
Specifies the primary material or composition of a structure, surface, or object. Used for barriers, walls, and other features when specific material tags don't apply.

## Data Type
String value representing the material composition. Applied to various features (ways, nodes, areas).

## Common Material Types

**Stone/Rock:**
- `stone` - Generic stone
- `granite` - Granite
- `marble` - Marble
- `sandstone` - Sandstone
- `limestone` - Limestone
- `slate` - Slate

**Masonry:**
- `brick` - Brick/masonry
- `concrete` - Concrete
- `cement_block` - Concrete blocks
- `adobe` - Adobe blocks
- `clay` - Clay tiles/blocks

**Wooden:**
- `wood` - Wooden material
- `timber` - Timber/lumber

**Metal:**
- `metal` - Generic metal
- `steel` - Steel
- `iron` - Iron
- `aluminum` - Aluminum

**Other:**
- `glass` - Glass
- `plastic` - Plastic
- `rubber` - Rubber
- `asphalt` - Asphalt/tar
- `canvas` - Canvas material

## Common Values in Drone Simulator

The drone simulator uses `material` tags for color assignment via `buildingMaterialColors` and `barrierMaterialColors`:

**Building material colors (from buildingMaterialColors):**
- `brick` - Color: #c87060
- `concrete` - Color: #c8c4b8
- `glass` - Color: #a8c8d8
- `stone` - Color: #b8b0a0
- `wood` - Color: #c8a878
- `metal` - Color: #888888
- `plaster` - Color: #d8d4cc
- `render` - Color: #d8d4cc
- `cement_block` - Color: #b8b4a8

**Barrier material colors:**
- Inherits all building material colors for consistency

## Usage Notes

- Applied to `barrier`, `building`, `wall`, and other structures
- May be used as primary indicator when specific tags don't apply
- Complements specialized tags like `building:material`, `roof:material`, `surface`
- Color assignment supports aerial visualization
- Helps distinguish structures in visual rendering

## Related Tags
- `building:material` - Specific building wall material
- `roof:material` - Roof covering material
- `surface` - Road/path surface material
- `colour` / `color` - Visual color (may override material color)
- `barrier` - Barrier type
- `man:made` - Man-made structure type

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:material)
- [building:material tag documentation](building_material.md)
- [roof:material tag documentation](roof_material.md)
- [surface tag documentation](surface.md)
