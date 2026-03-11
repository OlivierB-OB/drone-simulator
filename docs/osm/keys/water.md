# water

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:water

## Definition
Specifies the type or classification of a water body (lake, pond, reservoir, etc.). Distinguishes between natural and artificial water features.

## Data Type
String value representing the water body classification. Applied to areas/multipolygons (closed features).

## Water Body Types

**Natural Water Bodies:**
- `lake` - Natural lake
- `pond` - Small natural water body
- `river` - Large flowing water feature (usually mapped as way, not area)
- `stream` - Small flowing water feature
- `lagoon` - Shallow coastal water body
- `moat` - Water-filled defensive feature
- `reservoir` - Artificial water storage

**Artificial/Modified:**
- `canal` - Artificial waterway (usually mapped as way)
- `ditch` - Small drainage channel
- `drain` - Drainage feature
- `basin` - Artificial water basin

**Specialized:**
- `swimming_pool` - Pool for swimming/recreation
- `fountain` - Decorative water feature
- `bathing_pool` - Public bathing area
- `reflecting_pool` - Ornamental reflecting water surface

## Usage Notes

- Applied to areas and multipolygon relations (closed features)
- Water features mapped as lines use `waterway` tag instead
- Use with `natural` tag for broader feature classification
- Combine with `name` for identification
- May include depth information via `depth` tag

## Related Tags
- `waterway` - Linear water features (rivers, streams, canals)
- `natural` - Natural feature type classification
- `level` - Underground/elevated water features
- `layer` - Z-order for overlapping features
- `name` - Feature name
- `source` - Water source information
- `seasonal` - Seasonal water feature indicator

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:water)
- [waterway tag documentation](waterway.md)
- [natural tag documentation](natural.md)
