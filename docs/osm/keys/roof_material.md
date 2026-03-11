# roof:material

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:roof:material

## Definition

The `roof:material=*` key describes "the outermost material of the roof" of a building or building part. It is used for 3D building modeling, where renderers use this value to determine roof appearance and coloring.

Applied to areas and multipolygon relations. Requires `building=*` or `building:part=*`. Status: de facto standard.

## Data Type

Enumeration with 30+ standardized values:

**Common materials:**
- `roof_tiles` — ceramic or clay tiles
- `metal` — generic metal roofing
- `concrete` — concrete slab
- `asphalt` — asphalt surface
- `asphalt_shingle` — asphalt shingles
- `tar_paper` — bitumen/felt roofing
- `glass` — glass panels

**Natural materials:**
- `slate` — natural slate tiles
- `stone` — stone covering
- `thatch` — thatched roof
- `grass` — living/green roof
- `wood` — wooden shingles or planks
- `bamboo`, `palm_leaves`, `banana_leaves` — regional organic materials

**Specialty materials:**
- `copper` — copper sheeting (often patinated green)
- `zinc` — zinc sheeting
- `titanium` — titanium panels
- `eternit` — fibre cement sheets
- `solar_panels` — photovoltaic panels
- `acrylic_glass` — transparent plastic panels

User-defined values are permitted for materials not in this list.

## Related Tags

- [roof:shape](roof_shape.md) — Roof form (required context)
- [roof:colour](roof_colour.md) — Explicit color (renderers may derive from material)
- [building:material](building_material.md) — Facade material
- [roof:height](roof_height.md) — Height of the roof section

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:roof:material)
