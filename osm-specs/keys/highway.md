# Key: `highway` — Roads, Paths, and Highway Features

> Source: https://wiki.openstreetmap.org/wiki/Key:highway

## Description

The primary key for tagging roads, paths, and related infrastructure in OpenStreetMap. Used on ways for linear features and on nodes for point features such as signs, crossings, and signals. Common sub-tags applicable across most highway ways include `surface=*`, `lanes=*`, `maxspeed=*`, `oneway=*`, `access=*`, `lit=*`, `name=*`, `ref=*`, and `tree_lined=*`.

## Values

---

## Roads

### `highway=motorway`

- **Element types**: way
- **Description**: A restricted access major divided highway, normally with 2 or more running lanes plus an emergency hard shoulder. Access is typically limited to motor vehicles only.
- **Common sub-tags**: `oneway=yes`, `lanes=*`, `maxspeed=*`, `ref=*`, `access=*`
- **Status**: approved

### `highway=trunk`

- **Element types**: way
- **Description**: The most important roads in a country's system that are not motorways. May or may not have controlled access.
- **Common sub-tags**: `ref=*`, `lanes=*`, `maxspeed=*`, `oneway=*`
- **Status**: approved

### `highway=primary`

- **Element types**: way
- **Description**: The next most important roads in a country's road system after trunk roads, typically linking large towns.
- **Common sub-tags**: `ref=*`, `lanes=*`, `maxspeed=*`, `oneway=*`
- **Status**: approved

### `highway=secondary`

- **Element types**: way
- **Description**: The next most important roads in a country's system after primary roads. Often link towns.
- **Common sub-tags**: `ref=*`, `lanes=*`, `maxspeed=*`
- **Status**: approved

### `highway=tertiary`

- **Element types**: way
- **Description**: The next most important roads in a country's system after secondary roads. Often link smaller towns and villages.
- **Common sub-tags**: `ref=*`, `lanes=*`, `maxspeed=*`
- **Status**: approved

### `highway=unclassified`

- **Element types**: way
- **Description**: The least important through roads in a country's system. Not a classification of quality; used when no other classification fits.
- **Common sub-tags**: `surface=*`, `maxspeed=*`
- **Status**: approved

### `highway=residential`

- **Element types**: way
- **Description**: Roads which serve as access to housing, without the function of connecting settlements. Used in residential areas.
- **Common sub-tags**: `surface=*`, `maxspeed=*`, `oneway=*`
- **Status**: approved

---

## Link Roads

### `highway=motorway_link`

- **Element types**: way
- **Description**: Ramps and slip roads connecting to or from motorways. Implies `oneway=yes` and `access=*` matching the motorway.
- **Common sub-tags**: `oneway=yes`, `maxspeed=*`
- **Status**: approved

### `highway=trunk_link`

- **Element types**: way
- **Description**: Ramps and slip roads connecting to or from trunk roads.
- **Status**: approved

### `highway=primary_link`

- **Element types**: way
- **Description**: Ramps and slip roads connecting to or from primary roads.
- **Status**: approved

### `highway=secondary_link`

- **Element types**: way
- **Description**: Ramps and slip roads connecting to or from secondary roads.
- **Status**: approved

### `highway=tertiary_link`

- **Element types**: way
- **Description**: Ramps and slip roads connecting to or from tertiary roads.
- **Status**: approved

---

## Special Road Types

### `highway=living_street`

- **Element types**: way
- **Description**: For living streets, which are residential streets where pedestrians have legal priority over cars, with low speed limits and shared space design.
- **Common sub-tags**: `maxspeed=*`, `surface=*`
- **Status**: approved

### `highway=service`

- **Element types**: way / area
- **Description**: For access roads to or within an industrial estate, camp site, business park, car park, alleys, and similar areas.
- **Common sub-tags**: `service=alley/driveway/parking_aisle`, `access=*`, `oneway=*`
- **Status**: approved

### `highway=pedestrian`

- **Element types**: way / area
- **Description**: For roads used mainly or exclusively for pedestrians in shopping and some residential areas. May allow limited vehicle access.
- **Common sub-tags**: `area=yes`, `surface=*`, `access=*`
- **Status**: approved

### `highway=track`

- **Element types**: way
- **Description**: Roads for mostly agricultural or forestry uses. Not typically used by the general public.
- **Common sub-tags**: `tracktype=grade1/grade2/grade3/grade4/grade5`, `surface=*`, `access=*`
- **Status**: approved

### `highway=bus_guideway`

- **Element types**: way
- **Description**: A busway where the vehicle is guided by the way (though not a railway). The roadway itself physically guides the bus.
- **Common sub-tags**: `access=no`, `psv=yes`
- **Status**: approved

### `highway=escape`

- **Element types**: way
- **Description**: For runaway truck ramps, emergency escape ramps, or truck arrester beds at the side of steep roads.
- **Status**: approved

### `highway=raceway`

- **Element types**: way
- **Description**: A course or track for motor racing or other racing activities.
- **Common sub-tags**: `surface=*`, `oneway=*`
- **Status**: approved

### `highway=road`

- **Element types**: way
- **Description**: A road or way of unknown type. For temporary use when the classification has not yet been determined. Should be replaced with a specific value.
- **Status**: approved (temporary use only)

### `highway=busway`

- **Element types**: way
- **Description**: A dedicated roadway for bus rapid transit systems, physically separated from general traffic lanes.
- **Common sub-tags**: `psv=yes`, `access=no`
- **Status**: approved

---

## Paths

### `highway=footway`

- **Element types**: way / area
- **Description**: For designated footpaths mainly or exclusively for pedestrians. Also used with `footway=sidewalk` or `footway=crossing` for sub-types.
- **Common sub-tags**: `surface=*`, `lit=*`, `bicycle=yes`, `incline=*`, `footway=sidewalk/crossing/traffic_island`
- **Status**: approved

### `highway=bridleway`

- **Element types**: way
- **Description**: For horse riders. Pedestrians are usually also permitted; cyclists may be permitted depending on local regulations.
- **Common sub-tags**: `access=*`, `surface=*`
- **Status**: approved

### `highway=steps`

- **Element types**: way
- **Description**: For flights of steps (stairs) on footways or paths.
- **Common sub-tags**: `step_count=*`, `surface=*`, `handrail=*`, `incline=up/down`
- **Status**: approved

### `highway=corridor`

- **Element types**: way
- **Description**: For a hallway inside a building used for routing pedestrian movement indoors.
- **Common sub-tags**: `indoor=yes`, `level=*`, `width=*`
- **Status**: approved

### `highway=path`

- **Element types**: way
- **Description**: A non-specific path for use when a more specific tag (footway, bridleway, cycleway) is not known or appropriate.
- **Common sub-tags**: `foot=*`, `bicycle=*`, `horse=*`, `surface=*`, `sac_scale=*`, `trail_visibility=*`
- **Status**: approved

### `highway=via_ferrata`

- **Element types**: way
- **Description**: A route equipped with fixed cables, stemples, ladders, and bridges to aid climbers on mountain terrain.
- **Common sub-tags**: `via_ferrata_scale=*`, `sac_scale=*`
- **Status**: approved

### `highway=cycleway`

- **Element types**: way
- **Description**: For designated cycleways intended primarily or exclusively for cyclists.
- **Common sub-tags**: `foot=*`, `bicycle=designated`, `surface=*`, `oneway=*`, `segregated=*`
- **Status**: approved

---

## Lifecycle Values

### `highway=proposed`

- **Element types**: way
- **Description**: For planned roads that have been proposed but not yet under construction.
- **Common sub-tags**: `proposed=*`
- **Status**: approved

### `highway=construction`

- **Element types**: way
- **Description**: For roads currently under construction.
- **Common sub-tags**: `construction=motorway/primary/...`, `opening_date=*`
- **Status**: approved

---

## Node Features

### `highway=elevator`

- **Element types**: node
- **Description**: An elevator or lift used to travel vertically between different levels.
- **Common sub-tags**: `capacity=*`, `wheelchair=yes`, `level=*`
- **Status**: approved

### `highway=emergency_bay`

- **Element types**: node
- **Description**: An area beside a highway where a driver can safely stop a car in an emergency.
- **Status**: approved

### `highway=give_way`

- **Element types**: node
- **Description**: A give way or yield sign requiring drivers to yield to traffic on the intersecting road.
- **Status**: approved

### `highway=mini_roundabout`

- **Element types**: node
- **Description**: Similar to roundabouts, but at the centre there is either a painted circle or a fully traversable island. Implies one-way circulation.
- **Common sub-tags**: `direction=anticlockwise/clockwise`
- **Status**: approved

### `highway=motorway_junction`

- **Element types**: node
- **Description**: Indicates a junction (UK) or exit (US) from a motorway or other major road.
- **Common sub-tags**: `ref=*`, `name=*`
- **Status**: approved

### `highway=passing_place`

- **Element types**: node
- **Description**: The location of a passing space on a single-track road where vehicles can pull aside to allow oncoming traffic to pass.
- **Status**: approved

### `highway=speed_camera`

- **Element types**: node
- **Description**: A fixed road-side or overhead speed camera used to enforce speed limits.
- **Common sub-tags**: `ref=*`, `maxspeed=*`, `direction=*`
- **Status**: approved

### `highway=stop`

- **Element types**: node
- **Description**: A stop sign requiring drivers to come to a complete stop before proceeding.
- **Status**: approved

### `highway=street_lamp`

- **Element types**: node
- **Description**: A street light, lamppost, street lamp, light standard, or lamp standard used to illuminate roads and footways.
- **Common sub-tags**: `lit=yes`, `lamp_type=*`, `support=*`
- **Status**: approved

### `highway=turning_circle`

- **Element types**: node
- **Description**: A turning circle is a rounded, widened area usually at the end of a road allowing vehicles to turn around.
- **Status**: approved

### `highway=turning_loop`

- **Element types**: node
- **Description**: A widened area of a highway with a non-traversable island for turning, similar to a turning circle but with a central island.
- **Status**: approved
