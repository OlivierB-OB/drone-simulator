# railway

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:railway

## Definition
Primary tag used to specify the type of railway line or rail transport infrastructure. Indicates the functional classification and operational characteristics of the rail feature.

## Data Type
String value representing the railway type classification. Applied to ways (linear features).

## Railway Classifications

**Mainline Railways:**
- `rail` - Standard gauge main line railway
- `narrow_gauge` - Narrower gauge railway (< standard 1435mm)
- `light_rail` - Tram-quality rail, separate from road
- `tram` - Street-running tram/streetcar tracks
- `metro` - Underground/rapid transit system
- `monorail` - Single rail system
- `funicular` - Cable-driven inclined railway

**Specialty/Status:**
- `disused` - Former railway no longer in use
- `abandoned` - Abandoned railway (very degraded)
- `construction` - Railway under construction
- `preserved` - Historic/heritage railway

## Usage Notes

- Applied to ways (linear features only)
- Combine with `gauge` tag for detailed rail specifications
- Use with `layer` and `bridge`/`tunnel` for grade separation
- `level` indicates underground/elevated sections
- `tracks` specifies number of parallel rails

## Related Tags
- `gauge` - Rail track gauge in millimeters
- `tracks` - Number of parallel railway tracks
- `bridge` - Bridge crossing indicator
- `tunnel` - Tunnel indicator
- `layer` - Z-order for grade separation
- `level` - Underground/elevated indication
- `service` - Service type (main, siding, spur, branch)
- `maxspeed` - Speed limit

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:railway)
- [gauge tag documentation](gauge.md)
