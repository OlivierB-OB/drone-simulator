# OSM Map Features Reference

> Source: https://wiki.openstreetmap.org/wiki/Map_features
> Generated: 2026-02-25

This reference documents OpenStreetMap map feature tags relevant to 3D cartoonish world rendering — features that can be visualized as 3D meshes, terrain surfaces, or terrain-modifying elements.

## Categories

| Category | Key | Description | File |
|----------|-----|-------------|------|
| Aerialway | `aerialway` | Different forms of transportation for people or goods using aerial wires, including cable-cars, chair-lifts, and drag-lifts. | [aerialway.md](aerialway.md) |
| Aeroway | `aeroway` | Features related to aerodromes, airfields, and ground facilities supporting airplane and helicopter operations. | [aeroway.md](aeroway.md) |
| Barrier | `barrier` | Linear barriers and access control features on highways, including fences, walls, gates, and bollards. | [barrier.md](barrier.md) |
| Bridge / Tunnel | `bridge`, `tunnel` | Way modifiers indicating a feature passes over (bridge) or under (tunnel) another; paired with `layer=*`. | [bridge.md](bridge.md) |
| Building | `building` | Structures categorized by function: accommodation, commercial, religious, civic, agricultural, sports, storage, and technical. | [building.md](building.md) |
| Building Part | `building:part` | Sections of a building with distinct physical attributes (height, shape, colour) used for 3D mesh generation. | [building_part.md](building_part.md) |
| Building Colour / Material | `building:colour`, `building:material` | Façade colour and surface material for 3D texture rendering. | [building_colour.md](building_colour.md) |
| Building Levels | `building:levels`, `building:min_level` | Above-ground floor count and starting level for building parts; used to estimate height. | [building_levels.md](building_levels.md) |
| Geological | `geological` | Geological features and formations such as outcrops, volcanoes, and glacial features. | [geological.md](geological.md) |
| Height | `height`, `min_height` | Vertical extent of a feature in metres; `min_height` sets the base for elevated parts. | [height.md](height.md) |
| Highway | `highway` | Road classification and path types for vehicles and pedestrians, including roads, paths, and cycleways. | [highway.md](highway.md) |
| Historic | `historic` | Historical sites, monuments, ruins, and heritage features such as castles, churches, and battlefields. | [historic.md](historic.md) |
| Landuse | `landuse` | Land classification including developed, rural/agricultural, traffic/transportation, and waterbody areas. | [landuse.md](landuse.md) |
| Layer | `layer` | Vertical ordering of overlapping or crossing features; positive = above ground, negative = below. | [layer.md](layer.md) |
| Leisure | `leisure` | Recreation and leisure facilities including parks, sports pitches, playgrounds, and swimming pools. | [leisure.md](leisure.md) |
| Level | `level` | Zero-based floor index inside a structure; 0 = ground floor, negative = underground. | [level.md](level.md) |
| Location | `location` | Physical placement of a feature: `underground`, `underwater`, `overhead`, `overground`. | [location.md](location.md) |
| Man Made | `man_made` | Human-constructed features and structures not covered by other keys, such as towers, bridges, and pipelines. | [man_made.md](man_made.md) |
| Natural | `natural` | Natural features including vegetation, water bodies, and geological formations. | [natural.md](natural.md) |
| Power | `power` | Electrical power infrastructure including power lines, substations, generators, and transformers. | [power.md](power.md) |
| Railway | `railway` | Rail infrastructure including tracks, stations, trams, subways, and level crossings. | [railway.md](railway.md) |
| Roof | `roof:shape`, `roof:height`, `roof:colour`, `roof:material`, `roof:direction`, `roof:angle`, `roof:orientation` | Roof geometry and appearance attributes for 3D mesh generation. | [roof.md](roof.md) |
| Surface | `surface` | Physical material of a road, path, or area surface; used for ground texture selection. | [surface.md](surface.md) |
| Tree Lined | `tree_lined` | Trees deliberately planted along the sides of a highway or waterway. | [tree_lined.md](tree_lined.md) |
| Water | `water` | Water body features including rivers, lakes, reservoirs, and ponds. | [water.md](water.md) |
| Waterway | `waterway` | Natural and constructed waterways including rivers, canals, streams, and dams. | [waterway.md](waterway.md) |

## Quick Tag Reference

### Aerialway
- `aerialway=cable_car` — Enclosed cabin suspended from a fixed-grip cable
- `aerialway=gondola` — Enclosed cabin on a circulating cable
- `aerialway=mixed_lift` — Combination of gondola and chair-lift on the same line
- `aerialway=chair_lift` — Open or enclosed chairs suspended from a cable
- `aerialway=drag_lift` — Generic drag lift (surface lift)
- `aerialway=t-bar` — T-shaped bar tow lift for two skiers
- `aerialway=j-bar` — J-shaped bar tow lift for a single skier
- `aerialway=platter` — Platter/disk tow system attached between the legs
- `aerialway=rope_tow` — Simple rope tow system
- `aerialway=zip_line` — Cable-based descent system for recreation
- `aerialway=goods` — Freight/cargo aerial transport only
- `aerialway=pylon` — Support pylon/tower for an aerial cable
- `aerialway=station` — Terminal or boarding station for an aerial lift

### Aeroway
- `aeroway=aerodrome` — Airport or airfield (the main area)
- `aeroway=airstrip` — Simple field where light aircraft can land and take off
- `aeroway=apron` — Area where planes are parked, loaded, refuelled, or boarded
- `aeroway=control_center` — Facility controlling aircraft in airspace en route
- `aeroway=hangar` — Structure to hold aircraft or spacecraft
- `aeroway=helipad` — Landing area or platform for helicopters
- `aeroway=heliport` — Main area dedicated to helicopter operations
- `aeroway=highway_strip` — Landing strip that doubles as a road
- `aeroway=jet_bridge` — Passenger boarding bridge connecting terminal to aircraft
- `aeroway=model_runway` — Runway for model aircraft
- `aeroway=navigationaid` — Aid supporting visual navigation for aircraft
- `aeroway=runway` — Prepared surface for aircraft landing and takeoff
- `aeroway=spaceport` — Site for launching or receiving spacecraft
- `aeroway=stopway` — Surface beyond runway end used during aborted takeoff
- `aeroway=taxilane` — Path in airport parking area or apron
- `aeroway=taxiway` — Path connecting runways with ramps, hangars, and terminals
- `aeroway=terminal` — Building where passengers transfer between ground and air transport
- `aeroway=tower` — Air traffic control tower

### Barrier
- `barrier=fence` — Linear barrier made of various materials
- `barrier=wall` — Solid barrier of stone, brick, or concrete
- `barrier=hedge` — Line of closely spaced shrubs
- `barrier=gate` — Openable section in a fence or wall
- `barrier=lift_gate` — Horizontal bar barrier across a road

### Building
- `building=yes` — Generic building
- `building=house` — Detached residential building
- `building=apartments` — Multi-unit residential building
- `building=commercial` — Commercial use building
- `building=retail` — Retail use building
- `building=industrial` — Industrial use building
- `building=warehouse` — Storage warehouse
- `building=school` — School building
- `building=church` — Christian church
- `building=mosque` — Islamic mosque
- `building=hospital` — Hospital building
- `building=hotel` — Hotel building
- `building=garage` — Private vehicle garage

### Geological
- `geological=outcrop` — Exposed rock formation at surface
- `geological=volcanic_lava_field` — Area covered by lava flows
- `geological=moraine` — Glacial deposit landform

### Highway
- `highway=motorway` — High-capacity motorway or freeway
- `highway=trunk` — Important road, not motorway standard
- `highway=primary` — Primary road linking major settlements
- `highway=secondary` — Secondary road linking towns
- `highway=tertiary` — Tertiary road linking villages
- `highway=unclassified` — Local road not fitting higher categories
- `highway=residential` — Road in a residential area
- `highway=service` — Road for access to buildings or facilities
- `highway=living_street` — Residential street with pedestrian priority and low speeds
- `highway=pedestrian` — Road used mainly or exclusively by pedestrians
- `highway=track` — Agricultural or forestry track
- `highway=footway` — Designated path for pedestrians
- `highway=cycleway` — Designated path for cyclists
- `highway=bridleway` — Designated path for horse riders
- `highway=path` — Generic path for non-motorized travel
- `highway=steps` — Stairs / flight of steps on a footway
- `highway=motorway_link` — Ramp connecting to/from a motorway
- `highway=trunk_link` — Ramp connecting to/from a trunk road
- `highway=primary_link` — Ramp connecting to/from a primary road
- `highway=secondary_link` — Ramp connecting to/from a secondary road
- `highway=tertiary_link` — Ramp connecting to/from a tertiary road
- `highway=construction` — Road currently under construction (add `construction=*` for type)

### Historic
- `historic=castle` — Castle or fortification
- `historic=ruins` — Remains of a former structure
- `historic=monument` — Memorial monument
- `historic=memorial` — Memorial to an event or person
- `historic=church` — Historic church building
- `historic=manor` — Historic manor house

### Landuse
- `landuse=residential` — Residential area
- `landuse=commercial` — Commercial and business area
- `landuse=industrial` — Industrial area
- `landuse=retail` — Retail commercial area
- `landuse=farmland` — Agricultural cropland
- `landuse=forest` — Managed forest or woodland
- `landuse=grass` — Grassed area
- `landuse=meadow` — Meadow or field
- `landuse=cemetery` — Burial ground
- `landuse=construction` — Area under construction
- `landuse=quarry` — Mineral extraction site
- `landuse=recreation_ground` — Open space for informal recreation

### Leisure
- `leisure=park` — Public park or green space
- `leisure=garden` — Ornamental garden
- `leisure=playground` — Children's play area
- `leisure=pitch` — Sports playing field or court
- `leisure=sports_centre` — Indoor or outdoor sports facility
- `leisure=swimming_pool` — Swimming pool
- `leisure=track` — Dedicated sports track
- `leisure=golf_course` — Golf course
- `leisure=marina` — Boat mooring and services
- `leisure=dog_park` — Enclosed area for dogs to run freely

### Man Made
- `man_made=tower` — Free-standing tower structure
- `man_made=water_tower` — Elevated water storage structure
- `man_made=chimney` — Industrial chimney or smokestack
- `man_made=pipeline` — Pipe for transporting liquids or gases
- `man_made=bridge` — Bridge structure
- `man_made=pier` — Structure extending into water
- `man_made=storage_tank` — Tank for storing liquids
- `man_made=windmill` — Wind-powered mill structure
- `man_made=lighthouse` — Tower with light to guide ships

### Natural
- `natural=wood` — Wooded area, trees (`leaf_type=broadleaved/needleleaved/mixed`, `leaf_cycle=deciduous/evergreen/mixed`)
- `natural=tree` — Individual tree
- `natural=tree_row` — Line of trees along a road or field boundary
- `natural=grassland` — Natural grassland area
- `natural=heath` — Area of heathland
- `natural=moor` — Upland boggy area with low-growing vegetation
- `natural=fell` — Habitat above the tree line (grass, dwarf shrubs, mosses)
- `natural=tundra` — Treeless cold climate habitat (arctic / alpine)
- `natural=scrub` — Uncultivated land covered with shrubs or stunted trees
- `natural=water` — Body of water
- `natural=wetland` — Wetland area (`wetland=marsh/reedbed/saltmarsh/bog/fen/swamp/mangrove/tidalflat/wet_meadow/string_bog`)
- `natural=beach` — Sandy or shingle beach
- `natural=cliff` — Vertical or near-vertical rock face
- `natural=volcano` — Volcanic mountain
- `natural=glacier` — Glacier or ice field
- `natural=bare_rock` — Exposed bedrock surface
- `natural=scree` — Loose angular rocks from rockfall
- `natural=sand` — Sand-covered area
- `natural=mud` — Mud flat or tidal mud

### Power
- `power=line` — High-voltage power transmission line
- `power=minor_line` — Low-voltage distribution power line
- `power=tower` — Pylon supporting a high-voltage line
- `power=pole` — Pole supporting a power line
- `power=substation` — Electrical substation
- `power=generator` — Electricity generation facility
- `power=plant` — Power station or plant

### Railway
- `railway=rail` — Standard gauge railway track
- `railway=narrow_gauge` — Narrow gauge railway track
- `railway=tram` — Tram or streetcar track
- `railway=light_rail` — Light rail track
- `railway=station` — Railway station
- `railway=halt` — Small stopping point, fewer facilities than a station
- `railway=level_crossing` — Railway and road level crossing

### Water
- `water=lake` — Natural lake
- `water=reservoir` — Artificial water reservoir
- `water=pond` — Small body of still water
- `water=river` — River (as area)
- `water=canal` — Artificial canal (as area)
- `water=lagoon` — Coastal lagoon

### Waterway
- `waterway=river` — Large natural flowing watercourse
- `waterway=stream` — Small natural flowing watercourse
- `waterway=canal` — Artificial navigable waterway
- `waterway=drain` — Artificial drainage channel
- `waterway=dam` — Dam structure across a watercourse
- `waterway=weir` — Low dam or barrier in a river
- `waterway=waterfall` — Waterfall
- `waterway=lock_gate` — Gate in a canal lock
- `waterway=dock` — Enclosed area of water for ships

### Building Part
- `building:part=yes` — Generic building section with distinct attributes
- `building:part=porch` — Entrance canopy or vestibule
- `building:part=balcony` — Overhanging exterior platform
- `building:part=column` — Vertical structural support
- `building:part=corridor` — Enclosed connection between building masses
- `building:part=roof` — Roof-only structure (no walls below)
- `building:part=steps` — Exterior stepped base section
- `building:part=staircase` — Staircase tower component

### Building Colour / Material
- `building:colour=#RRGGBB` — Façade hex colour code
- `building:colour=white/red/…` — Façade named colour
- `building:material=brick` — Brick façade
- `building:material=concrete` — Concrete façade
- `building:material=plaster` — Plastered / stucco façade
- `building:material=wood` — Timber cladding
- `building:material=glass` — Full-height glass façade
- `building:material=stone` — Natural stone
- `building:material=metal` — Metal cladding
- `building:material=timber_framing` — Half-timbered façade

### Building Levels
- `building:levels=N` — Number of above-ground floors
- `building:min_level=N` — Starting floor index for elevated building parts
- `building:levels:underground=N` — Number of below-ground floors

### Height
- `height=N` — Total height in metres from lowest ground to roof top
- `min_height=N` — Height above ground where a feature base begins (metres)

### Layer
- `layer=1` — Above ground (bridge, elevated road)
- `layer=2` — Two levels above ground (flyover)
- `layer=-1` — Below ground (tunnel, underpass)

### Level
- `level=0` — Ground floor
- `level=1`, `level=2`, … — Floors above ground
- `level=-1`, `level=-2`, … — Basement / underground floors
- `level=0;1` — Feature spanning multiple floors

### Location
- `location=underground` — Feature buried below ground surface (not rendered)
- `location=underwater` — Feature submerged below water surface (not rendered)
- `location=overhead` — Feature elevated above ground without a bridge structure (rendered as elevated mesh)
- `location=overground` — Feature explicitly at ground level (rendered normally)

### Roof
- `roof:shape=flat` — Level roof (default when absent)
- `roof:shape=gabled` — Two slopes meeting at a ridge
- `roof:shape=hipped` — Four slopes meeting at a ridge or apex
- `roof:shape=pyramidal` — Four equal triangular faces at a single apex
- `roof:shape=dome` — Hemispherical surface
- `roof:shape=onion` — Bulbous dome (Orthodox style)
- `roof:shape=cone` — Conical roof
- `roof:shape=skillion` — Single sloping plane
- `roof:shape=mansard` — Double-slope on all four sides
- `roof:shape=gambrel` — Double-slope barn roof
- `roof:shape=round` — Cylindrical barrel roof
- `roof:height=N` — Vertical rise of the roof in metres
- `roof:angle=N` — Slope inclination in degrees
- `roof:direction=N` — Compass bearing the roof faces (0–360°)
- `roof:orientation=along/across` — Ridge along or across longest wall
- `roof:colour=#RRGGBB` — Roof surface colour
- `roof:material=roof_tiles` — Ceramic or terracotta tiles
- `roof:material=slate` — Natural slate
- `roof:material=metal` — Metal sheet
- `roof:material=concrete` — Concrete slab
- `roof:material=grass` — Living / turf roof
- `roof:material=thatch` — Thatched straw or reed

### Surface
- `surface=asphalt` — Asphalt road (standard)
- `surface=concrete` — Concrete slab
- `surface=paving_stones` — Smooth stone or block paving
- `surface=sett` — Rough-cut natural stones
- `surface=cobblestone` — Uncut rounded cobblestones
- `surface=gravel` — Loose gravel
- `surface=compacted` — Compacted gravel/soil mix
- `surface=dirt` — Exposed soil / earth
- `surface=grass` — Grass-covered ground
- `surface=sand` — Sand
- `surface=wood` — Wooden planks or decking
- `surface=metal` — Metal plate surface
- `surface=artificial_turf` — Synthetic grass (sports)
- `surface=tartan` — Synthetic running track

### Tree Lined
- `tree_lined=both` — Trees on both sides of the way
- `tree_lined=left` — Trees on the left side (relative to way direction)
- `tree_lined=right` — Trees on the right side
- `tree_lined=yes` — Trees present, side unspecified (treated as `both`)
- `tree_lined=no` — No tree lining (explicit absence)
- `tree_lined=separate` — Trees mapped separately as `natural=tree_row`; skip auto-generation

### Bridge / Tunnel
- `bridge=yes` — Standard bridge (add `layer=1`)
- `bridge=viaduct` — Series of spans across a valley
- `bridge=aqueduct` — Bridge carrying a canal or water channel
- `bridge=boardwalk` — Plank walkway over wet terrain
- `bridge=movable` — Drawbridge or swing bridge
- `tunnel=yes` — Standard underground tunnel (add `layer=-1`)
- `tunnel=building_passage` — Passage through a building
- `tunnel=culvert` — Small pipe carrying water under a road
- `tunnel=avalanche_protector` — Covered mountain road section
