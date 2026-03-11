# landuse

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:landuse

## Definition
Describes the primary human use or purpose of a land area. Covers both managed land (agriculture, urban) and natural areas with human management or classification.

## Data Type
String value representing the land use classification. Applied to areas/multipolygons (closed features).

## Common Land Use Types

**Agricultural:**
- `farmland` - Cultivated agricultural land
- `orchard` - Fruit/nut tree orchard
- `vineyard` - Grape vineyard
- `plant_nursery` - Plant/seed nursery

**Grassland/Open:**
- `grassland` - Open grass area
- `meadow` - Natural or semi-natural grassland
- `grass` - General grass area
- `allotments` - Community garden plots

**Green Spaces:**
- `park` - Public park
- `garden` - Private/public garden
- `recreation_ground` - Recreation area
- `cemetery` - Burial ground

**Urban:**
- `residential` - Residential housing area
- `commercial` - Commercial/business district
- `retail` - Retail shopping area
- `industrial` - Industrial zone
- `military` - Military facility area

**Special/Modified:**
- `construction` - Under construction
- `landfill` - Waste disposal site
- `sand` - Sand extraction/dune area
- `beach` - Beach area (may overlap with natural=beach)

## Common Values in Drone Simulator

The drone simulator uses `landuse` tags for aerial canvas rendering via `groundColors.landuse`:

**Vegetation/green (color #90b860):**
- grassland, meadow, grass, park, garden, recreation_ground, plant_nursery

**Agricultural (color #c0cc70 to #88a048):**
- farmland (#c0cc70), orchard (#98c068), vineyard (#88a048), allotments (#88aa50)

**Cemetery (color #b0c8a8):**
- cemetery

**Construction (color #c0aa88):**
- construction

**Urban development (color #d8d4cc):**
- residential, commercial, retail, industrial, military

**Natural surfaces:**
- sand (#e8d89a), beach (#e8d89a)

## Usage Notes

- Applied to areas and multipolygon relations
- Often overlaps with `natural` classification
- Use with `name` for area identification
- May combine with more specific tags (e.g., `farmland` + `crop` for crop type)
- Primary classification for ground texture rendering

## Related Tags
- `natural` - Natural feature classification (complementary)
- `leisure` - Recreation and leisure use
- `name` - Area name
- `crop` - Specific crop (with farmland)
- `crop_rotation` - Crop rotation pattern
- `access` - Access restrictions
- `layer` - Z-order for overlapping features

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:landuse)
- [natural tag documentation](natural.md)
- [leisure tag documentation](leisure.md)
- [Canvas Rendering Documentation](../../visualization/canvas-rendering.md)
