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

## Common Values in Drone Simulator

The drone simulator uses `building:material` for wall color overrides via `buildingMaterialColors` in config.ts:

| Material | Color | Hex |
|----------|-------|-----|
| `brick` | Terracotta red | #c87060 |
| `concrete` | Light gray | #c8c4b8 |
| `glass` | Light blue | #a8c8d8 |
| `stone` | Brown gray | #b8b0a0 |
| `wood` | Tan brown | #c8a878 |
| `metal` | Steel gray | #888888 |
| `plaster` | Off-white | #d8d4cc |
| `render` | Off-white | #d8d4cc |
| `cement_block` | Gray | #b8b4a8 |

When not specified, the default building color from `building:type` is used.

## Related Tags

- [building:colour](building_colour.md) — Explicit wall color (overrides material color)
- [roof:material](roof_material.md) — Roof surface material
- [material](material.md) — Generic material (multi-purpose)

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:material)
