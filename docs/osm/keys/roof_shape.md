# roof:shape

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:shape

## Definition

The `roof:shape=*` key describes "the shape of a building's roof, or the shape of the roof of a building part."

This tag requires either `building=*` or `building:part=*` on the same element. It applies to nodes and areas but not standalone ways or relations (except multipolygons).

## Data Type

Enumeration with 20+ documented roof shape types:

**Simple Pitched Roofs:**
- `flat` — Level roof with no pitch
- `gabled` — Two sloped sides meeting at a ridge (standard A-frame)
- `skillion` — Single sloped surface
- `saltbox` — Asymmetrical gabled roof

**Hipped Roofs:**
- `hipped` — Sloped on all four sides
- `half_hipped` — Combination of gabled and hipped
- `side_hipped`, `side_half_hipped` — Variations with offset ridge

**Complex Shapes:**
- `mansard` — Double-sloped roof with steep lower section
- `gambrel` — Distinctive multi-sloped roof (barn-style)
- `hipped_and_gabled` — Multi-faceted hip and gable combination
- `pyramidal` — Pyramid-shaped roof
- `crosspitched`, `sawtooth` — Geometric variations
- `butterfly` — Curved upward shape

**Curved/Special Forms:**
- `cone` — Conical roof form
- `dome` — Hemispherical/domed roof
- `onion` — Bulbous onion-dome shape
- `round` — Cylindrical/rounded roof

## Related Tags

- [roof:colour](roof_colour.md) — Roof color (hex code or text)
- [roof:material](roof_material.md) — Roof surface material (tiles, slate, etc.)
- [roof:height](roof_height.md) — Height of roof above building
- [roof:direction](roof_direction.md) — Roof slope direction (deprecated)
- [roof:orientation](roof_orientation.md) — Roof orientation bearing

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:shape)
