**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Landcover

# Landcover

## Description

Landcover describes the physical material at the earth's surface, including grass, asphalt, trees, bare ground, and water. It differs from landuse, which describes human use of land.

## Primary Tags

- `landuse=*`
- `natural=*`
- `surface=*`
- `landcover=*`

## Key Tagging Systems

### Landuse Tags
Many landuse types imply specific landcover, though some are ambiguous. Examples include `landuse=meadow` (grass) versus `landuse=military` (unspecified).

### Natural Tags
Natural area features typically have clear landcover implications:
- `natural=wood` or `natural=forest` for trees
- `natural=beach` requires supplemental `surface=*` tags
- `natural=desert` needs more specific features like `natural=sand` or `natural=scrub`

### Surface Tags
Secondary tags specifying material on features like highways, parking lots, or beaches.

### Direct Landcover Tags
The `landcover=*` key was proposed to directly tag landcover types but sees minimal use.

## Natural and Semi-Natural Areas

| Landcover | Tags | Notes |
|-----------|------|-------|
| Forest (Deciduous) | `landuse=forest` or `natural=wood` + `leaf_cycle=deciduous` | Also see wetland variants |
| Grassland | `landuse=grass/meadow` or `natural=grassland` | Includes grasses, pulses, sedges |
| Wetlands | `natural=wetland` + `wetland=bog/marsh/swamp/reedbed` | Multiple specialized types |
| Water | `natural=water` or `waterway=riverbank` | Use `intermittent=yes` for temporary water |
| Bare Rock | `natural=bare_rock` | Bedrock; see scree/shingle for loose stones |
| Sand | `natural=sand` | Often combined with `natural=beach` |

## Agriculture, Developed, and Built Environments

| Landcover | Tags | Category |
|-----------|------|----------|
| Farmland | `landuse=farmland` | Agriculture (row crops, grains) |
| Meadow/Pasture | `landuse=meadow` | Agriculture (grasses, herbs) |
| Orchard | `landuse=orchard` | Agriculture (also plantations) |
| Residential | `landuse=residential` | Developed (houses, yards, gardens) |
| Industrial | `landuse=industrial` | Developed (buildings, warehouses) |
| Commercial | `landuse=commercial` | Developed (office, services) |
| Parking | `amenity=parking` | Transportation (surface specified separately) |
| Quarry | `landuse=quarry` | Developed (rock, gravel, sand extraction) |

## Controversial Cases: Forests

Mappers disagree on whether to use `landuse=forest` or `natural=wood` for tree-covered areas. Some mappers use these tags for any tree-covered area, while others prefer specific applications. See Forest documentation for details.

## Classification Systems

### National Land Cover Database (NLCD)
Standardized US classification with categories:
- Water (Open Water, Ice/Snow)
- Developed (varying intensity levels)
- Barren Land
- Forest (Deciduous, Evergreen, Mixed)
- Shrubland
- Herbaceous/Grassland
- Planted/Cultivated
- Wetlands

### Land Cover Classification System (LCCS)
International FAO system using diagnostic classifiers for flexibility. Supports multiple vegetation layers and specialized categories for aquatic/regularly flooded areas, artificial surfaces, and bare areas.

## Classification Approaches

**A priori systems** define classes before data collection, providing standardization but rigidity. **A posteriori systems** define classes after analysis, offering flexibility and local adaptation but lacking standardization.
