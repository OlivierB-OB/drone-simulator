# building:material

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:material

## Definition

The `building:material` key describes "the outer surface material of building walls, also known as the facade or façade."

It indicates what the external layer is made of or covered with, not the internal wall structure. For example, a brick-filled concrete frame is tagged as `building:material=brick` (the visible surface), not concrete.

## Data Type

Enumeration with 30+ documented material types:

**Masonry:**
- `brick` — Traditional ceramic bricks
- `stone`, `sandstone`, `limestone` — Natural stone
- `cement_block`, `concrete_block` — Precast blocks

**Concrete:**
- `concrete` — Plain concrete
- `reinforced_concrete` — Reinforced concrete

**Plaster/Coating:**
- `plaster`, `stucco`, `pebbledash` — Surface coatings
- `render`, `mortar` — Finishing plasters

**Natural Materials:**
- `wood`, `timber`, `logs` — Timber construction
- `clay`, `adobe`, `loam`, `rammed_earth` — Earth materials
- `reed`, `thatch` — Traditional materials

**Metal:**
- `steel`, `metal`, `metal_plates`, `copper` — Metallic surfaces

**Modern:**
- `glass` — Glass facade
- `plastic`, `vinyl` — Synthetic materials
- `solar_panels` — Photovoltaic panels

## Related Tags

- [building:colour](building_colour.md) — Explicit wall color (overrides material color)
- [roof:material](roof_material.md) — Roof surface material
- [material](material.md) — Generic material (multi-purpose)

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:material)
