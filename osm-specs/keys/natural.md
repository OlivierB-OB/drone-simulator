# Key: `natural` — Natural

> Source: https://wiki.openstreetmap.org/wiki/Key:natural

## Description

The `natural` key is used to describe natural physical land features, including vegetation, water bodies, landforms, and geological features. It covers both pristine nature and areas influenced by human activity that retain natural characteristics. Values span a wide range of terrain and ecological types.

## Values

### Vegetation

### `natural=wood`

- **Element types**: node / area
- **Description**: A tree-covered area (a "forest" or "wood"). Supports additional detail via `leaf_type=*` and `leaf_cycle=*`.
- **Common sub-tags**: `leaf_type=broadleaved/needleleaved/mixed`, `leaf_cycle=deciduous/evergreen/mixed`, `name=*`

### `natural=tree_row`

- **Element types**: way
- **Description**: A line of trees, typically planted along a road, path, or field boundary.
- **Common sub-tags**: same as `natural=tree` below — all physical attributes apply to every tree in the row.

**Sub-tags:**

| Tag | Values | Rendering use |
|-----|--------|--------------|
| `leaf_type` | `broadleaved`, `needleleaved`, `leafless` | Canopy shape: sphere vs cone |
| `leaf_cycle` | `deciduous`, `evergreen`, `semi_deciduous`, `semi_evergreen` | Canopy color range |
| `height` | number (metres) | Tree height; fallback 8–15 m random |
| `diameter_crown` | number (metres) | Crown diameter; fallback `height × 0.8`. Also used as inter-tree spacing along the line |
| `circumference` | number (metres) | Trunk circumference at 1.3 m; trunk radius = `circumference / (2π)` |
| `diameter` | number (millimetres by convention) | Trunk diameter; radius = `diameter / 2000` |
| `species` | scientific name e.g. `Juglans regia` | Informational; may drive species-specific shape in future |
| `genus` | scientific name e.g. `Quercus` | Informational |

### `natural=tree`

- **Element types**: node
- **Description**: A single tree, notable or otherwise worthy of individual mapping. Placed at the exact node coordinate.

**Sub-tags:**

| Tag | Values | Rendering use |
|-----|--------|--------------|
| `leaf_type` | `broadleaved`, `needleleaved`, `leafless` | Canopy shape: sphere (broadleaved/default) or cone (needleleaved) |
| `leaf_cycle` | `deciduous`, `evergreen`, `semi_deciduous`, `semi_evergreen` | Canopy color: darker/deeper for evergreen, brighter for deciduous |
| `height` | number (metres) | Tree height; fallback 8–15 m random |
| `diameter_crown` | number (metres) | Crown diameter; crown radius = `diameter_crown / 2`; fallback `height × 0.4` |
| `circumference` | number (metres) | Trunk circumference at 1.3 m above ground (preferred trunk measurement); radius = `circumference / (2π)` |
| `diameter` | number (millimetres by convention) | Trunk diameter at breast height (alternative); radius = `diameter / 2000` |
| `species` | scientific name e.g. `Quercus robur` | Informational; may drive species-specific shape in future |
| `genus` | scientific name e.g. `Quercus` | Informational |
| `sex` | `male`, `female` | For dioecious species; no rendering distinction currently |
| `protected` | `yes`, `no` | Legal protection status; no rendering distinction |
| `denotation` | e.g. `natural_monument` | Significance marker; no rendering distinction |

**Rendering priority for trunk radius** (highest to lowest): `circumference` tag → `diameter` tag → 0.3 m default.

### `natural=scrub`

- **Element types**: node / area
- **Description**: Uncultivated land covered with shrubs, bushes, or stunted trees.

### `natural=heath`

- **Element types**: node / area
- **Description**: A dwarf-shrub habitat characterised by open, low-growing woody vegetation, often on acidic or nutrient-poor soils.

### `natural=moor`

- **Element types**: node / area
- **Description**: Upland areas characterised by low-growing vegetation on acidic soils, typically found in wet, boggy conditions.

### `natural=grassland`

- **Element types**: area
- **Description**: Areas where vegetation is dominated by grasses and other herbaceous (non-woody) plants.

### `natural=fell`

- **Element types**: node / area
- **Description**: Habitat above the tree line covered with grass, dwarf shrubs, and mosses, typically in upland or subarctic regions.

### `natural=tundra`

- **Element types**: area / multipolygon relation
- **Description**: Treeless cold climate habitat with open, low-growing sedges, grasses, mosses, and lichens. Applies to arctic, alpine, and antarctic tundra where tree growth is limited by low temperatures and short growing seasons. Use more specific tags (`natural=heath`, `natural=grassland`, `natural=wetland`) when individual vegetation patches within the tundra are mapped separately.
- **Common sub-tags**: `name=*`, `ele=*`
- **Status**: in use

### `natural=bare_rock`

- **Element types**: area
- **Description**: An area with sparse or no soil or vegetation where bedrock is exposed at the surface.

### `natural=scree`

- **Element types**: node / area
- **Description**: Unconsolidated angular rocks resulting from rockfall and weathering of adjacent rock faces.

### `natural=shingle`

- **Element types**: node / area
- **Description**: An area of beach or riverbank covered with small, rounded pebbles or gravel.

### `natural=sand`

- **Element types**: node / area
- **Description**: An area covered by sand with no or very little vegetation.

### `natural=mud`

- **Element types**: node / area
- **Description**: An area covered with mud: water-saturated fine-grained soil without plant growth, such as mudflats or tidal mud.

---

### Water

### `natural=water`

- **Element types**: area
- **Description**: Any body of water, from natural features such as lakes and ponds to artificial ones like moats or canals.
- **Common sub-tags**: `water=lake`, `water=river`, `water=pond`, `water=reservoir`

### `natural=wetland`

- **Element types**: area
- **Description**: A natural area subject to inundation or with waterlogged ground. Requires `wetland=*` to specify the type; affects ground texture (green/brown/blue-green).
- **Common sub-tags**: `wetland=*` (required), `name=*`

#### `wetland=*` values

| Value | Description |
|-------|-------------|
| `marsh` | Periodically saturated area dominated by herbaceous (non-woody) vegetation |
| `reedbed` | Inundated area dominated by tall reeds or bulrushes |
| `saltmarsh` | Coastal marsh exposed to tidal seawater; salt-tolerant herbs |
| `tidalflat` | Coastal intertidal area of deposited sediment, exposed at low tide |
| `wet_meadow` | Semi-wetland meadow saturated with water throughout much of the year |
| `swamp` | Waterlogged forested area with dense tree/shrub vegetation |
| `mangrove` | Coastal brackish-to-saline tidal wetland with salt-tolerant trees |
| `bog` | Peat-filled depression fed by rainfall; acidic, nutrient-poor |
| `fen` | Groundwater-fed peat wetland covered by grasses, sedges, and reeds |
| `string_bog` | Bog with alternating elevated ridges (woody plants) and wet sedge flats |

### `natural=bay`

- **Element types**: node / area
- **Description**: An area of water mostly surrounded by land but with a level connection to an ocean or large lake.

### `natural=cape`

- **Element types**: node
- **Description**: A piece of elevated land sticking out into the sea or a large lake.

### `natural=coastline`

- **Element types**: way
- **Description**: The mean high water springs line between the sea and land. Conventionally drawn clockwise around land masses so that land is to the left.

### `natural=reef`

- **Element types**: area
- **Description**: A feature (rock, sandbar, coral, etc.) lying beneath or near the surface of water, potentially hazardous to navigation.

### `natural=spring`

- **Element types**: node
- **Description**: A place where groundwater flows naturally from the ground to the surface.

### `natural=hot_spring`

- **Element types**: node
- **Description**: A spring of geothermally heated groundwater emerging at the surface.

### `natural=geyser`

- **Element types**: node
- **Description**: A spring characterised by intermittent discharge of water ejected turbulently and accompanied by steam, caused by geothermal heating.

### `natural=blowhole`

- **Element types**: node / area
- **Description**: An opening to a sea cave resulting in blasts of water due to wave action forcing water through a narrow passage.

### `natural=glacier`

- **Element types**: node / area
- **Description**: A permanent body of ice formed naturally from snow that moves under its own weight.

---

### Elevation / Land

### `natural=volcano`

- **Element types**: node
- **Description**: An opening exposed on the earth's surface where volcanic material is emitted. Can be active, dormant, or extinct.
- **Common sub-tags**: `name=*`, `ele=*`, `volcano:status=*`, `volcano:type=*`

### `natural=valley`

- **Element types**: node / way
- **Description**: A natural depression flanked by ridges or mountain ranges, typically formed by water erosion or glacial activity.

### `natural=ridge`

- **Element types**: way
- **Description**: A mountain or hill linear landform with a continuous elevated crest.

### `natural=arete`

- **Element types**: way
- **Description**: A thin, knife-like ridge of rock typically formed by the erosion of two parallel glaciated valleys on either side.

### `natural=cliff`

- **Element types**: node / way / area
- **Description**: A vertical or almost vertical natural drop in terrain with a bare rock surface.

### `natural=saddle`

- **Element types**: node
- **Description**: The lowest point along a ridge or between two mountain tops; a mountain pass.
- **Common sub-tags**: `name=*`, `ele=*`

### `natural=rock`

- **Element types**: node / area
- **Description**: A notable rock or group of rocks attached to underlying bedrock, protruding from the surrounding terrain.

### `natural=stone`

- **Element types**: node
- **Description**: A single notable freestanding rock, possibly a glacial erratic, not attached to bedrock.

### `natural=sinkhole`

- **Element types**: node / area
- **Description**: A natural depression or hole in the surface topography formed by the collapse of underlying karst or other substrate.

### `natural=earth_bank`

- **Element types**: way
- **Description**: A large erosion gully or steep earth bank, typically created by water erosion cutting into soft ground.

### `natural=arch`

- **Element types**: node / way / area
- **Description**: A rock arch naturally formed by erosion, with an opening large enough to see through underneath.

### `natural=peninsula`

- **Element types**: node / area
- **Description**: A piece of land projecting into water from a larger land mass, nearly surrounded by water on three sides.

---

### Other

### `natural=beach`

- **Element types**: node / area
- **Description**: A landform along a body of water consisting of sand, shingle, or other loose material deposited by waves or currents.
- **Common sub-tags**: `surface=sand`, `surface=shingle`, `surface=gravel`

### `natural=beach_ridge`

- **Element types**: way / area
- **Description**: A raised ridge of beach material (sand, gravel, or shells) formed by wave action, running roughly parallel to the shoreline.

### `natural=isthmus`

- **Element types**: node / area
- **Description**: A narrow strip of land bordered by water on two sides, connecting two larger land masses.

### `natural=crevasse`

- **Element types**: way / area
- **Description**: A large crack or fissure in a glacier or ice sheet.

### `natural=dune`

- **Element types**: node / way / area
- **Description**: A hill of sand formed by wind action, covered with no or very little vegetation.

### `natural=fumarole`

- **Element types**: node
- **Description**: An opening in the earth's crust, typically near a volcano, emitting steam and volcanic gases.
