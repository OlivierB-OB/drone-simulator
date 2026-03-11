# aerialway

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:aerialway

## Definition
Specifies aerial transport systems including cable cars, ski lifts, gondolas, and other suspended transportation.

## Data Type
String value representing the aerial transport type. Applied to ways (lines) and nodes (stations/pylons).

## Common Aerial Transport Types

**Passenger Transport:**
- `cable_car` - Cable-pulled transport (San Francisco style)
- `gondola` - Suspended cable transport (common at ski resorts)
- `mixed_lift` - Combined surface/aerial lift
- `chair_lift` - Chair suspended on moving cable
- `drag_lift` - Surface drag lift (T-bar, J-bar, platter)
- `t-bar` - T-shaped drag lift
- `j-bar` - J-shaped drag lift
- `platter` - Platter/disc drag lift
- `rope_tow` - Rope tow lift
- `magic_carpet` - Motorized carpet lift

**Specialty:**
- `station` - Terminal station
- `pylon` - Support pylon/tower
- `jig_bungee` - Jig bungee lift

## Usage Notes

- Applied to ways (cable lines) and nodes (stations/pylons)
- `aerialway=pylon` on nodes for support structures
- `aerialway=station` on nodes for terminals
- Use with `name` for facility identification
- `operator` specifies managing company
- `capacity` indicates passenger/freight capacity
- `duration` for travel time information

## Related Tags
- `man:made` - Infrastructure classification
- `name` - Facility name
- `operator` - Operating company
- `capacity` - Transport capacity (people/hour)
- `duration` - Typical journey duration (minutes)
- `opening_hours` - Seasonal/daily operation
- `height` - Height of structure
- `layer` - Z-ordering for overlapping features

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:aerialway)
- [man:made tag documentation](man_made.md)
- [aeroway tag documentation](aeroway.md)
