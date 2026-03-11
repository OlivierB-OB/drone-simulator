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
