# Visual Specifications for OSM Data Rendering

## 1. Scope

**In scope**: Physical features visible from a drone — terrain, buildings, roads, water,
vegetation, infrastructure structures, barriers (walls, hedges).

**Out of scope**: Labels, administrative boundaries, POI icons, route relations, speed
limits, turn restrictions, surveillance equipment, pipelines (underground), power lines
(too thin), historic features (too sparse).

**Philosophy**: Colors and shapes reflect what things **look like**, not what category they
belong to. A road looks like asphalt. A building looks like concrete or brick. The user
should feel like they are flying over a real place, not reading a map.

---

## 2. Rendering Modes

| Mode | Description | Examples |
|------|-------------|---------|
| `ground` | Painted on the terrain texture (canvas 2D) | Roads, water bodies, bare soil, farmland |
| `mesh` | 3D geometry placed above terrain | Buildings, towers, chimneys |
| `both` | Ground texture + 3D mesh | Forests (green patch + instanced tree meshes) |

---

## 3. Ground Texture Draw Order

Layers are painted back to front (painter's algorithm). Later layers draw over earlier ones.

| Order | Layer |
|-------|-------|
| 1 | Base ground (default bare-earth fill) |
| 2 | Landuse / natural landcover areas |
| 3 | Water bodies (polygon) |
| 4 | Wetlands |
| 5 | Waterway lines |
| 6 | Vegetation areas (forest, scrub) |
| 7 | Airport surfaces |
| 8 | Building footprint shadows (only when no 3D mesh) |
| 9 | Roads — small widths first, then large |
| 10 | Railways |

---

## 4. Appearance Reference

Colors are chosen to approximate real-world appearance seen from above.

| Feature | Real-world appearance | Color |
|---------|----------------------|-------|
| Asphalt road / sealed surface | Mid gray | `#777060` |
| Light paving (footway, pedestrian) | Pale gray | `#ccccbb` |
| Dirt track | Sandy brown | `#c4a882` |
| Built-up area (any urban landuse) | Warm light gray | `#d8d4cc` |
| Concrete building wall | Gray-white | `#d0ccbc` |
| Plaster / render wall | Cream | `#ddd8c8` |
| Brick wall | Warm red-brown | `#c87060` |
| Grass / meadow | Mid green | `#90b860` |
| Forest canopy | Dark green | `#3a7a30` |
| Water body / waterway | Deep blue | `#3a6ab0` |
| Water line (river, stream, canal…) | Blue | `#4a7ac0` |
| Sand / beach | Sandy yellow | `#e8d89a` |
| Bare rock | Gray-brown | `#b8a888` |
| Farmland (ploughed) | Dark brown | `#a0845a` |
| Farmland (crops) | Yellow-green | `#c0cc70` |
| Default ground | Sandy beige | `#d8c8a8` |

---

## 5. Feature Specifications

### 5.1 Ground / Landcover

Default ground fill: `#d8c8a8`

| OSM tag(s) | Geometry | Fill color | Notes |
|-----------|---------|-----------|-------|
| `natural=grassland` | Polygon | `#90b860` | |
| `landuse=meadow` | Polygon | `#90b860` | |
| `leisure=park` | Polygon | `#90b860` | |
| `landuse=recreation_ground` | Polygon | `#90b860` | |
| `landuse=farmland` | Polygon | `#c0cc70` | Yellow-green crops default |
| `landuse=orchard` | Polygon | `#98c068` | `both` — ground fill + instanced tree rows (see §7.3) |
| `landuse=vineyard` | Polygon | `#88a048` | `both` — ground fill + instanced bush rows (see §7.4) |
| `landuse=allotments` | Polygon | `#88aa50` | |
| `landuse=cemetery` | Polygon | `#b0c8a8` | Muted green |
| `landuse=construction` | Polygon | `#c0aa88` | Disturbed earth |
| `landuse=residential` | Polygon | `#d8d4cc` | Built-up area |
| `landuse=commercial` | Polygon | `#d8d4cc` | Built-up area |
| `landuse=retail` | Polygon | `#d8d4cc` | Built-up area |
| `landuse=industrial` | Polygon | `#d8d4cc` | Built-up area |
| `landuse=military` | Polygon | `#d8d4cc` | Built-up area |
| `natural=sand` | Polygon | `#e8d89a` | |
| `natural=beach` | Polygon | `#e8d89a` | |
| `natural=dune` | Polygon | `#e8d89a` | |
| `natural=bare_rock` | Polygon | `#b8a888` | |
| `natural=scree` | Polygon | `#c0b090` | |
| `natural=mud` | Polygon | `#a89870` | |
| `natural=glacier` | Polygon | `#e8f0ff` | Pale blue-white |

### 5.2 Water Bodies

| OSM tag(s) | Geometry | Fill color | Notes |
|-----------|---------|-----------|-------|
| `natural=water` (any) | Polygon | `#3a6ab0` | Deep blue |
| `water=river`, `water=oxbow` | Polygon | `#3a6ab0` | |
| `water=lake` | Polygon | `#3a6ab0` | |
| `water=reservoir` | Polygon | `#3a6ab0` | |
| `water=pond` | Polygon | `#3a6ab0` | |
| `water=canal` | Polygon | `#3a6ab0` | |
| `water=moat` | Polygon | `#3a6ab0` | |
| `natural=wetland` | Polygon | `#5a9a6a` | Blue-green |
| `natural=coastline` | Polygon | `#3a6ab0` | Ocean side fill |

### 5.3 Waterway Lines

| OSM tag(s) | Color | Width (px) | Notes |
|-----------|-------|-----------|-------|
| `waterway=river` | `#4a7ac0` | 4–8 | Graduated by `width` tag if available |
| `waterway=stream` | `#4a7ac0` | 2 | |
| `waterway=tidal_channel` | `#4a7ac0` | 2 | |
| `waterway=canal` | `#4a7ac0` | 3 | |
| `waterway=drain` | `#4a7ac0` | 1 | |
| `waterway=ditch` | `#4a7ac0` | 1 | |
| `waterway=dam` | `#888880` | 3 | Concrete/earth color |
| `waterway=weir` | `#888880` | 2 | |

### 5.4 Vegetation Areas

| OSM tag(s) | Geometry | Fill color | Render mode | Notes |
|-----------|---------|-----------|------------|-------|
| `natural=wood` | Polygon | `#3a7a30` | `both` | Ground fill + instanced trees |
| `landuse=forest` | Polygon | `#3a7a30` | `both` | Ground fill + instanced trees |
| `natural=scrub` | Polygon | `#5a8a40` | `both` | Ground fill + instanced bush meshes |
| `natural=heath` | Polygon | `#8a7a50` | `ground` | Brown-green |
| `natural=fell` | Polygon | `#a0a070` | `ground` | |
| `natural=tundra` | Polygon | `#a0a070` | `ground` | |
| `landuse=plant_nursery` | Polygon | `#88b060` | `ground` | |
| `natural=tree_row` | LineString | — | `mesh` | Tree meshes placed along line at ~8 m intervals |
| `natural=tree` | Point | — | `mesh` | Single tree mesh at point |

### 5.5 Roads / Highways

Lines drawn with `lineCap: round`, `lineJoin: round`. No centerline markings (too small at tile scale). Drawn small → large so major roads appear on top.

**Width priority:** When `width=*` (or `width:carriageway=*`) is present, convert metres
to canvas pixels using the tile scale factor (see `others/width_of_streets.md`). The pixel
values in the table below are fallbacks for when no width tag is available.

| highway=* | Color | Width (px) |
|-----------|-------|-----------|
| `motorway`, `trunk` | `#777060` | 6 |
| `motorway_link`, `trunk_link` | `#777060` | 4 |
| `primary` | `#777060` | 5 |
| `primary_link` | `#777060` | 3 |
| `secondary` | `#777060` | 4 |
| `secondary_link` | `#777060` | 2.5 |
| `tertiary` | `#777060` | 3 |
| `tertiary_link` | `#777060` | 2 |
| `residential` | `#777060` | 2 |
| `unclassified` | `#777060` | 2 |
| `service` | `#777060` | 1.5 |
| `living_street` | `#777060` | 1.5 |
| `pedestrian` | `#ccccbb` | 2 |
| `footway`, `path` | `#ccccbb` | 1 |
| `cycleway` | `#ccccbb` | 1 |
| `track` | `#c4a882` | 1 |
| `bridleway` | `#c8b870` | 1 |
| `steps` | `#ccccbb` | 1 | Dash: [2, 2] |

Bridge roads: same color, visually elevated via 3D mesh layer, not canvas.

**Road color priority:** The `surface=*` tag overrides the highway-type color. Width is never affected by the surface tag.

1. `surface=*` present → use color from surface table below
2. No `surface` tag (or unrecognized value) → use highway-type color from table above

| `surface=*` | Color | Notes |
|-------------|-------|-------|
| `asphalt` *(default fallback)* | `#777060` | Matches highway-type default |
| `concrete`, `concrete:plates`, `concrete:lanes` | `#ccccbb` | Light paving |
| `paving_stones`, `paving_stones:lanes` | `#ccccbb` | Light paving |
| `sett`, `unhewn_cobblestone` | `#b0a090` | Stone — warm mid-gray |
| `bricks` | `#c87060` | Warm red-brown |
| `metal`, `metal_grid` | `#909090` | Cool gray |
| `wood`, `stepping_stones` | `#b08860` | Warm brown |
| `compacted`, `fine_gravel`, `gravel`, `pebblestone`, `shells` | `#c4a882` | Matches `track` color |
| `dirt`, `mud` | `#a88060` | Dark sandy brown |
| `grass` | `#90b860` | Matches grassland |
| `sand` | `#e8d89a` | Matches beach |
| `rock` | `#b8a888` | Matches `natural=bare_rock` |
| `snow`, `ice` | `#e8f0ff` | Matches glacier |
| `woodchips` | `#b09870` | Warm tan |
| `clay`, `tartan`, `artificial_turf`, `acrylic`, `rubber`, `carpet`, `plastic` | `#ccccbb` | Sports surfaces |

**Tree-lined roads:** When a highway way carries `tree_lined=both/left/right/yes`, tree
meshes are generated along the road sides (see §7.5). Road canvas appearance (color,
width) is unchanged. `tree_lined=separate` means trees are already mapped as
`natural=tree_row`; no additional trees are generated.

### 5.6 Railways

Dashed lines on canvas. No tie/sleeper rendering (too fine).

| railway=* | Color | Width (px) | Dash |
|----------|-------|-----------|------|
| `rail` | `#888888` | 2 | [5, 3] |
| `narrow_gauge` | `#888888` | 1.5 | [5, 3] |
| `light_rail` | `#888888` | 1.5 | [4, 3] |
| `tram` | `#888888` | 1 | [4, 3] |
| `monorail` | `#999999` | 1.5 | [4, 3] |
| `funicular` | `#888888` | 1.5 | [4, 3] |
| `disused`, `abandoned` | `#aaaaaa` | 1 | [2, 4] |

### 5.7 Aeroways (Ground)

| aeroway=* | Geometry | Color | Notes |
|----------|---------|-------|-------|
| `aerodrome` | Polygon | `#d8d4c0` | Base fill, very light |
| `runway` | Polygon or LineString (width 3px) | `#888880` | Asphalt/concrete |
| `taxiway` | LineString (width 2px) | `#999990` | |
| `taxilane` | LineString (width 1.5px) | `#999990` | |
| `apron` | Polygon | `#aaaaaa` | Light concrete |
| `helipad` | Polygon or Point (circle r=4px) | `#ccccaa` | |

---

## 6. 3D Mesh Features

### 6.1 Buildings

Buildings are extruded polygons. The base sits at terrain elevation. No ground footprint
is painted separately — the building mesh covers its own footprint.

#### Height (priority order)

1. `height` tag → parse as metres (strip unit suffix if present)
2. `building:levels` × 3.0 m + 1.0 m (roof allowance)
3. Type default:

| building=* | Default height |
|-----------|--------------|
| `house`, `detached`, `bungalow`, `semidetached_house` | 6 m |
| `terrace` | 8 m |
| `apartments`, `residential` | 12 m |
| `office`, `commercial`, `retail` | 15 m |
| `industrial`, `warehouse` | 8 m |
| `church`, `cathedral`, `basilica` | 20 m |
| `mosque`, `temple`, `synagogue` | 15 m |
| `school`, `university`, `hospital` | 10 m |
| `civic`, `government`, `public` | 12 m |
| `garage`, `garages`, `carport` | 3 m |
| `shed`, `greenhouse`, `barn` | 4 m |
| `hut`, `kiosk` | 3 m |
| `yes` (generic) | 6 m |

`min_height` / `building:min_level × 3.0` → raise base of extrusion above terrain
(arcades, overhangs, elevated sections).

#### Wall Color (priority order)

1. `building:colour` tag → use as-is (hex `#RRGGBB` or CSS color name)
2. `building:material` tag:

| material | Color |
|---------|-------|
| `brick` | `#c87060` |
| `concrete` | `#c8c4b8` |
| `plaster`, `render`, `pebbledash` | `#ddd8c8` |
| `wood`, `timber_framing` | `#b89060` |
| `glass` | `#a8c8d8` |
| `stone`, `sandstone`, `marble` | `#c0b090` |
| `metal` | `#a0a8b0` |
| `adobe`, `mud` | `#c0a870` |

3. Default: `#d0ccbc` (neutral cream-concrete)

#### Roof

**Roof color (priority order):**
1. `roof:colour` tag → use as-is
2. `roof:material` tag:

| material | Color |
|---------|-------|
| `roof_tiles`, `tiles` | `#b06040` |
| `slate` | `#708090` |
| `metal`, `zinc`, `tin` | `#9090a0` |
| `concrete` | `#909090` |
| `copper` | `#70a888` |
| `grass` | `#7aaa50` |
| `thatch` | `#c0a050` |
| `asphalt` | `#707070` |
| `solar_panels` | `#304060` |

3. Flat roof default: `#a0a090`
4. Pitched roof default: `#906050` (terra cotta)

**Roof shape** (`roof:shape` tag):

| value | Geometry |
|-------|---------|
| `flat` | Flat polygon cap at wall height |
| `gabled` | Two triangular faces meeting at a central ridge |
| `hipped` | Four sloped faces |
| `pyramidal` | Four triangular faces meeting at apex |
| `dome` | Hemisphere approximation |
| `onion` | Bulging hemisphere approximation |
| `cone` | Cone cap |
| `skillion` | Single sloped plane |
| *(missing or unknown)* | Flat fallback |

`roof:height` adds to the wall height for the apex position.
`roof:direction` controls ridge orientation (degrees, 0 = North).

### 6.2 Building Parts

Same rules as buildings. `building:part=yes` marks sub-volumes of a building outline.
Each part is extruded independently with its own height / min_height / color / roof tags.

### 6.3 Man-Made Structures

| OSM tag | Shape | Color | Dimensions |
|--------|-------|-------|-----------|
| `man_made=tower` | Cylinder | `#909090` | r: 2 m, h: from `height` or 30 m |
| `man_made=chimney` | Tapered cylinder | `#707070` | r: 2 m base, h: from `height` or 40 m |
| `man_made=mast` | Thin cylinder | `#aaaaaa` | r: 0.3 m, h: from `height` or 50 m |
| `man_made=communications_tower` | Thin cylinder | `#aaaaaa` | r: 1 m, h: from `height` or 60 m |
| `man_made=water_tower` | Cylinder + sphere cap | `#b8ccd8` | cylinder h: 15 m, sphere r: 5 m |
| `man_made=silo` | Cylinder | `#c0c0b8` | r: 3 m, h: from `height` or 12 m |
| `man_made=storage_tank` | Cylinder | `#aaaaaa` | r: from `diameter/2` or 5 m, h: from `height` or 8 m |
| `man_made=lighthouse` | White cylinder | `#f0f0e8` | r: 2 m, h: from `height` or 15 m |
| `man_made=crane` | Vertical box + arm | `#d4aa40` | h: from `height` or 40 m |
| `power=tower` | Thin box (lattice approx) | `#a0a8b0` | 0.5×0.5 m section, h: 40 m |
| `power=pole` | Thin cylinder | `#888880` | r: 0.1 m, h: 8 m |
| `aerialway=pylon` | Box | `#909090` | 0.5×0.5 m section, h: 10 m |

All structures: height from `height` tag takes priority over defaults above.

### 6.4 Barriers

Only linear barriers (`way` geometry) tall or wide enough to be visible from drone altitude are rendered. Point-only barriers (gate, stile, turnstile, etc.) are excluded — see §9.

**Solid wall barriers** are extruded linear box meshes. Base sits at terrain elevation.

| OSM tag | Render mode | Mesh width | Default height | Default color |
|---------|------------|-----------|---------------|--------------|
| `barrier=wall` | `mesh` | 0.3 m | `height` tag or 1.5 m | `#c8c4b8` (concrete) |
| `barrier=city_wall` | `mesh` | 2 m | `height` tag or 5 m | `#c0b090` (stone) |
| `barrier=retaining_wall` | `mesh` | 0.3 m | `height` tag or 1.5 m | `#b8a888` (earth/concrete) |
| `barrier=hedge` | `both` | canvas 1.5 m | `height` tag or 1.2 m | `#4a7030` ground + bush meshes |

**Wall color** (`material=*` tag, same palette as building walls):

| `material=*` | Color |
|-------------|-------|
| `brick` | `#c87060` |
| `concrete` | `#c8c4b8` |
| `stone`, `sandstone`, `marble` | `#c0b090` |
| `wood` | `#b89060` |
| `metal` | `#a0a8b0` |
| *(absent)* | type default (see table above) |

**Hedge** (`barrier=hedge`): canvas line at color `#4a7030`, width 1.5 m in pixels (using tile scale factor). Bush meshes placed along the line at ~1 m intervals, using the same oblate-sphere mesh as §7.2 scrub (color `#3a6828`–`#5a8838`, width 0.4–0.8 m sphere radius). Height from `height` tag or default 1.2 m. Ground draw order: layer 6 (same as vegetation areas).

---

## 7. Vegetation 3D

### 7.1 Instanced Trees

Applied to areas with `natural=wood` or `landuse=forest` (in addition to green ground fill).

**Distribution:** Grid with random jitter, or Poisson disk. Density: ~1 tree per 100 m².
Trees are clipped to polygon boundary.

**Tree mesh:**

| Part | Shape | Color range |
|------|-------|------------|
| Trunk | Cylinder, r: 0.3 m | `#8B6340` |
| Canopy — broadleaved (`leaf_type=broadleaved` or default) | Sphere | `#3a8a2a` to `#5aaa3a` (random per tree) |
| Canopy — needleleaved (`leaf_type=needleleaved`) | Cone | `#2a7020` to `#4a9030` |
| Total height | Random | 8–15 m |

> Forest/wood area tags (`leaf_type`, `leaf_cycle`) apply uniformly to all instanced trees in the area. No per-tree size data is available for area features — random fallbacks are always used.

**Single trees** (`natural=tree`, Point): placed at the node coordinate. Tag-driven dimensions take priority over random fallbacks.

| Property | Derivation |
|----------|-----------|
| Height | `height` tag if present, else 8–15 m random |
| Canopy shape | `leaf_type=needleleaved` → cone; `leaf_type=broadleaved` or absent → sphere |
| Canopy radius | `diameter_crown / 2` if present, else `height × 0.4` |
| Canopy color — evergreen | `#2a7020` to `#3a8a2a` (dark, year-round) |
| Canopy color — deciduous / absent | `#3a8a2a` to `#5aaa3a` (bright, spring/summer) |
| Trunk radius | `circumference / (2π)` if present, else `diameter / 2000` (mm→m), else 0.3 m |
| Trunk color | `#8B6340` |

**Tree rows** (`natural=tree_row`, LineString): trees placed along the line at regular
intervals. No canvas line — the trees themselves are the visual representation.

| Property | Derivation |
|----------|-----------|
| Inter-tree spacing | `diameter_crown` if present, else 8 m default |
| Individual tree | Same tag-driven rules as `natural=tree` above (all row trees share the same tags) |

### 7.2 Instanced Bushes

Applied to areas with `natural=scrub` (in addition to green ground fill).

**Distribution:** Grid with random jitter, or Poisson disk. Density: ~1 bush per 25 m².
Bushes are clipped to polygon boundary.

**Bush mesh:** no trunk. Single flattened sphere (oblate ellipsoid approximation: Y axis
scaled ×0.6 relative to the sphere radius).

| Part | Shape | Color range |
|------|-------|------------|
| Canopy | Sphere (flattened, ×0.6 Y) | `#4a7830` to `#6a9848` (random per bush) |
| Width | Random | 1.0–2.5 m (sphere radius) |
| Height | Random | 0.5–1.5 m (after Y scale) |

### 7.3 Orchard Rows

Applied to `landuse=orchard` (in addition to `#98c068` ground fill).

**Row layout:**
- Row direction: align to the **major axis of the polygon's bounding box** (longest side). Fallback: North–South.
- Row spacing: **5 m** centre-to-centre.
- Plant spacing along row: **4 m** centre-to-centre.
- Rows and plants are clipped to the polygon boundary.

**Tree mesh** (fruit/nut tree — shorter and more uniform than forest trees):

| Part | Shape | Color range |
|------|-------|------------|
| Trunk | Cylinder, r: 0.2 m | `#8B6340` |
| Canopy | Sphere (broadleaved) | `#4a9030` to `#70b848` (random per tree) |
| Total height | Random | 3–6 m |

### 7.4 Vineyard Rows

Applied to `landuse=vineyard` (in addition to `#88a048` ground fill).

**Row layout:**
- Row direction: same algorithm as orchard (major bounding-box axis, fallback N–S).
- Row spacing: **2 m** centre-to-centre (vine rows are tightly spaced).
- Plant spacing along row: **1 m** centre-to-centre.
- Rows and plants are clipped to the polygon boundary.

**Bush mesh** (low vine plant — much smaller than `natural=scrub` bushes):

| Part | Shape | Color range |
|------|-------|------------|
| Canopy | Sphere (flattened, ×0.5 Y) | `#4a7030` to `#6a9040` (random per plant) |
| Width | Random | 0.4–0.8 m (sphere radius) |
| Height | Random | 0.2–0.4 m (after Y scale) |

Vines are extremely low — the row lines are the dominant aerial visual, not individual plant height.

### 7.5 Tree-Lined Roads

Applied to highway ways carrying `tree_lined=both`, `tree_lined=left`,
`tree_lined=right`, or `tree_lined=yes`. No ground canvas change — road color and
width are unchanged.

**Side placement:**

| Value | Left side | Right side |
|-------|-----------|------------|
| `both` | ✓ | ✓ |
| `left` | ✓ | — |
| `right` | — | ✓ |
| `yes` | ✓ | ✓ |
| `no` | — | — |
| `separate` | — | — |

**Lateral offset from road centerline:** `road_half_width + 1.5 m` (just outside the
carriageway edge). `road_half_width` = rendered pixel width converted to metres / 2.
For unknown widths use the highway-type fallback from §5.5.

**Along-road spacing:** 8 m (same default as `natural=tree_row`).

**Tree mesh:** Identical rules to §7.1 single-tree / tree-row mesh. No per-tree tags
are available on the highway way — use the broadleaved random fallback:
height 8–15 m, sphere canopy `#3a8a2a`–`#5aaa3a`, trunk r: 0.3 m color `#8B6340`.

---

## 8. Bridges, Tunnels, and Vertical Placement

### Bridges

`bridge=yes` + `layer=N` (N ≥ 1):
- The road or rail geometry is elevated. Canvas does not render the bridge road separately.
- A bridge deck mesh is generated: flat box at layer height, color `#b0a898` (concrete).
- The road/rail mesh is placed on top of the deck.

### Underground features — not rendered

Any feature tagged with any of the following is excluded from rendering:

| Tag | Notes |
|-----|-------|
| `tunnel=yes` (any `layer`) | Physical tunnel — road/rail disappears underground, reappears at portal. Portal opening may be shown as a dark rectangle (optional, low priority). |
| `location=underground` | Feature is buried without an explicit tunnel structure (e.g. underground city roads, metro sections, buried cables). Same rendering outcome as `tunnel=yes`. |
| `level < 0` | Feature is on a basement/underground floor of a building (indoor mapping). Not visible from aerial view. |

**Rule:** any one of these tags is sufficient to exclude the feature. They are not mutually exclusive — a feature may carry several.

### Overhead features — rendered elevated

`location=overhead`: feature is elevated above ground but has no associated bridge structure (e.g. an overhead cable line). Render as elevated geometry at the default `layer=1` height. No deck mesh is generated — only the feature geometry itself.

### Layer stacking

`layer=N` controls draw order at crossings only — it does not alone determine whether a feature is underground or should be hidden. A way with `layer=-1` but no `tunnel=*` or `location=underground` is likely a mapping error; render it at ground level conservatively rather than hiding it.

---

## 9. Out of Scope (Not Rendered)

- Administrative boundaries (country, region, city)
- Leisure pitch markings (football lines, lane markers)
- Power lines — `power=line`, `power=minor_line` (too thin to see)
- Pipelines — `man_made=pipeline` (underground or visually insignificant)
- Historic features — `historic=*` (too sparse, too varied)
- Surveillance, monitoring equipment
- Amenity POI points (cafe, hospital location marker) — the *building* is rendered, not an icon
- Route relations, turn restrictions, access rules, speed limits
- Geological features (`geological=*`) — too rare and geologically subtle
- Leisure=pitch, sport=* field markings
- `barrier=fence`, `barrier=guard_rail`, `barrier=cable_barrier` — too thin to be visible at drone altitude
- Point-only barriers: `barrier=gate`, `barrier=lift_gate`, `barrier=stile`, `barrier=turnstile`, `barrier=bollard`, etc. — point features too small for aerial rendering

---

## 10. What This Spec Does Not Cover

- Rendering implementation: Three.js APIs, shader code, buffer geometry construction
- Data fetching: Overpass QL queries, tile caching, concurrency
- LOD / level of detail strategy
- Performance budgets or draw call limits
