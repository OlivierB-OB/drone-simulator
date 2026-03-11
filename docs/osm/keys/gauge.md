# gauge

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:gauge

## Definition
Specifies the distance between the inner rails of a railway track. The gauge determines compatibility and operational characteristics of the rail line.

## Data Type
Numeric value in millimeters (standard unit) or text value for common gauge names. Applied to ways (railway features).

## Common Gauge Values

**Standard Gauges (Numeric - millimeters):**
- `1435` - Standard gauge (most common worldwide)
- `1520` - Russian/Soviet gauge
- `1676` - Indian broad gauge
- `1000` - Meter gauge
- `762` - Narrow gauge (often for mountain railways)
- `600` - Narrow gauge (heritage railways)

**Named Gauge Values:**
- `standard` - 1435mm (standard gauge)
- `narrow` - Generic narrow gauge designation
- `broad` - Broad gauge designation

## Format

**Numeric format (preferred):**
- `gauge=1435` - Standard gauge in millimeters
- `gauge=1000` - Meter gauge
- `gauge=762` - Narrow gauge

**Text format (for common types):**
- `gauge=standard` - Standard gauge
- `gauge=narrow` - Narrow gauge variant

## Usage Notes

- Applied to `railway` features (main tag required)
- Standard gauge (1435mm) is the global default
- Different gauges prevent inter-compatibility
- Use with `railway=*` to classify the rail type
- Often combined with `narrow_gauge` railway type for clarity

## Related Tags
- `railway` - Rail type classification (mandatory)
- `tracks` - Number of parallel rails
- `maxspeed` - Speed limit (may vary by gauge)
- `bridge` / `tunnel` - Grade separation
- `operator` - Railway operator
- `service` - Service type (main, siding, branch)

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:gauge)
- [railway tag documentation](railway.md)
