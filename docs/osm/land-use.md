**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Land_use

# Land Use

## Description

Land use describes the human use of an area of land, such as housing, commercial activities, farming, education, leisure, etc. It is complementary to landcover, which describes the physical material covering the land.

## Key Concepts

Land use and landcover are related but distinct:
- **Land use**: the function (e.g., military, leisure)
- **Landcover**: the form (e.g., heathland, grass)

Many feature tags imply both simultaneously. For example, `landuse=vineyard` defines an area covered in grape vines and used to produce grapes.

## Primary Tags

- `landuse=*`
- `amenity=*`
- `leisure=*`
- `tourism=*`

## How to Map Land Use

### As Nodes
Land use is inherently an area feature. However, nodes may be used when mapping areas is not feasible, with the expectation they will be converted to areas later.

### Large Uninterrupted Areas
Initial mapping often involves broad categories like `landuse=residential`, `landuse=commercial`, or `landuse=industrial`. These should be refined with additional detail as mapping progresses.

### Detailed Mapping
Draw boundaries precisely following real-world limits. For example, a school boundary should follow the actual land used by the school. Public highway land should not be included in land use polygons.

## Selected Land Use Categories

| Purpose | Category | Tag |
|---------|----------|-----|
| Allotments | Agriculture | `landuse=allotments` |
| Aquaculture | Agriculture | `landuse=aquaculture` |
| Cemetery | Developed | `landuse=cemetery` |
| Commercial | Developed | `landuse=commercial` |
| Construction | Developed | `landuse=construction` |
| Farmland | Agriculture | `landuse=farmland` |
| Forest | Agriculture | `landuse=forest` |
| Industrial | Developed | `landuse=industrial` |
| Military | Military | `landuse=military` |
| Park | Leisure | `leisure=park` |
| Residential | Developed | `landuse=residential` |
| Retail | Developed | `landuse=retail` |
| School | Developed | `amenity=school` |
| Vineyard | Agriculture | `landuse=vineyard` |

## Important Notes

**Overlapping Land Uses**: A single location may exist within multiple land use categories simultaneously. For example, a construction site within military land that also contains forest.

**Inconsistent Usage**: Some tags represent landcover rather than land use. For instance, `landuse=forest` has been used for any tree-covered area rather than specifically areas used for timber production.

**One Primary Tag**: Generally, assign one primary land use per area, with more detailed tags used for features within larger areas.

## See Also

- OSM Landuse Landcover: WebGIS application for exploring land use/cover data
- OpenLandcoverMap: Renders landuse and natural tags
