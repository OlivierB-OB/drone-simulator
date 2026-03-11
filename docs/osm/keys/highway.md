# highway

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:highway

## Definition
The primary tag used to specify the type of road, path, or highway feature. Indicates the functional and physical characteristics of the route.

## Data Type
String value representing the road or path classification. Applied to ways (linear features).

## Common Road Classifications

**Major Roads (Sealed):**
- `motorway` - Limited-access highway with divided lanes
- `trunk` - Primary national/trunk routes
- `primary` - Secondary main roads connecting regions
- `secondary` - Regional connecting roads
- `tertiary` - Rural/local connecting roads

**Urban/Local Roads:**
- `residential` - Streets serving residential areas
- `unclassified` - Minor roads of unknown classification
- `service` - Service roads, alleys, parking areas
- `living_street` - Traffic-calmed residential streets

**Non-vehicle Routes:**
- `footway` - Pedestrian-only paths
- `pedestrian` - Pedestrian zones
- `cycleway` - Bicycle-only routes
- `path` - General multipurpose trails
- `bridleway` - Horse/livestock routes
- `track` - Unpaved rural tracks
- `steps` - Staircases and stairs

## Usage Notes

- Applied to ways (linear features only)
- May include `_link` variants (motorway_link, trunk_link, etc.) for connecting roads
- Combine with `surface` tag for detailed material properties
- Use `bridge`, `tunnel`, and `layer` for 3D positioning

## Related Tags
- `surface` - Material composition of the road
- `lanes` - Number of traffic lanes
- `maxspeed` - Speed limit
- `oneway` - Direction restriction
- `bridge` - Bridge indicator
- `tunnel` - Tunnel indicator
- `layer` - Z-order for overlapping features
- `access` - Access restrictions
- `lit` - Street lighting presence
- `width` - Road width in meters

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:highway)
- [surface tag documentation](surface.md)
