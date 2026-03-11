# leisure

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:leisure

## Definition
Specifies recreational and leisure uses of land. Covers spaces designed for outdoor recreation, sports, and public entertainment.

## Data Type
String value representing the leisure facility type. Applied to areas/multipolygons and nodes.

## Common Leisure Types

**Sports:**
- `sport_center` - Multi-sport facility
- `sports_hall` - Indoor sports facility
- `stadium` - Large sports stadium
- `tennis_court` - Tennis facility
- `golf_course` - Golf facility
- `swimming_pool` - Swimming facility
- `playground` - Children's play area
- `skating_rink` - Ice or roller skating

**Parks and Outdoor Recreation:**
- `park` - Public park (may use landuse instead)
- `nature_reserve` - Protected natural area
- `bird_hide` - Wildlife observation site
- `camping` - Camping ground
- `picnic_table` - Picnic area

**Entertainment:**
- `marina` - Boat harbor/marina
- `slipway` - Boat launching facility
- `beach_resort` - Beach leisure facility
- `amusement_arcade` - Game facility
- `cinema` - Movie theater
- `theatre` - Theater venue
- `nightclub` - Night entertainment venue

**Green Spaces:**
- `garden` - Garden space
- `park` - Park (general leisure)

## Usage Notes

- Applied to areas, multipolygons, and nodes
- Often overlaps with `landuse=recreation_ground`
- Use with `name` for facility identification
- May include operational tags (opening_hours, access, etc.)
- Complements `landuse` for more specific classification

## Related Tags
- `landuse` - Land use classification (complementary)
- `sport` - Specific sport type (with sport centers)
- `name` - Facility name
- `capacity` - Seating/capacity (venues)
- `opening_hours` - Operating hours
- `access` - Access restrictions
- `wheelchair` - Accessibility information

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:leisure)
- [landuse tag documentation](landuse.md)
- [natural tag documentation](natural.md)
