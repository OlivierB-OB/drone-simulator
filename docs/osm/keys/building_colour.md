# building:colour

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:colour

## Definition

The `building:colour=*` key indicates the color of a building's facade. It is primarily used for 3D building visualization, allowing renderers to display buildings in their real-world colors.

Applied to areas and multipolygon relations with `building=*` or `building:part=*`. Status: de facto (community-endorsed, not formally standardized).

## Data Type

Color value in one of two formats:

- **Hexadecimal**: `#RRGGBB` format preceded by `#` (e.g., `#FFFFFF` for white)
- **Named color**: Basic color words (e.g., `white`, `red`, `beige`) — interpretation may vary between renderers

Common examples:
- White: `#FFFFFF`
- Brick-red: `#E96B39`
- Limestone: `#F6F0D0`
- Stone grey: `#7A7D80`
- Light beige: `#CABC91`

Note: Hexadecimal values are preferred for consistency across renderers. When photographing for color reference, use overcast daylight conditions to minimize lighting bias.

## Related Tags

- [building](building.md) — Required parent tag
- [building:part](building_part.md) — For per-part color on complex buildings
- [building:material](building_material.md) — Alternative to direct color tagging
- [roof:colour](roof_colour.md) — Roof color (separate from facade)
- [building:levels](building_levels.md) — Related 3D property

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:colour)
