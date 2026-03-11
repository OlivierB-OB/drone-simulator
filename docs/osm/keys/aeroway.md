# aeroway

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:aeroway

## Definition
Specifies airport and airfield infrastructure elements including runways, taxiways, and terminal buildings.

## Data Type
String value representing the airport infrastructure type. Applied to ways (lines) and areas.

## Common Aeroway Types

**Runways/Surfaces:**
- `runway` - Aircraft landing and takeoff strip
- `taxiway` - Aircraft movement surface between runway and parking
- `taxilane` - Narrow taxiway
- `apron` - Parking and maneuvering area
- `helipad` - Helicopter landing site

**Facilities:**
- `aerodrome` - Airport (area feature)
- `hangar` - Aircraft storage building
- `terminal` - Passenger terminal building
- `gate` - Aircraft boarding gate
- `parking_position` - Parking/holding position

**Navigation:**
- `windsock` - Wind indicator

## Usage Notes

- Applied to ways (lines for taxiways, runways) and areas (aprons, aerodromes)
- Use with `name` for airport/facility identification
- `operator` specifies management authority
- Combine with `surface` for material information
- `width` indicates actual surface width
- `ref` may contain runway designation (e.g., "08/26")

## Related Tags
- `name` - Airport or facility name
- `operator` - Operating authority
- `surface` - Material composition
- `width` - Surface width in meters
- `ref` - Runway number designation
- `layer` - Z-ordering for overlapping features
- `lighting` - Surface lighting indicator

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:aeroway)
- [aerialway tag documentation](aerialway.md)
