# width

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:width

## Definition

The `width=*` key describes "the _actual_ width of a feature." For roads and streets, width is measured kerb-to-kerb (the carriageway width, excluding footways and verges). For doors and entrances, it is the opening width.

## Data Type

**Numeric values** with default unit **metres**:

| Format | Example | Notes |
|--------|---------|-------|
| Metres (default) | `width=3.5` | Decimal separator is period (.) |
| Feet+inches | `width=12'6"` | No spaces in feet/inches notation |
| Space-separated units | `width=4 m` | Space before unit (except feet/inches) |

Width is a continuous value, not discrete—use decimal precision for accuracy.

## Common Mistakes

- **Do not confuse with `maxwidth=*`** — `maxwidth=*` is a vehicle restriction (maximum permitted vehicle width), not a physical measurement.
- **Avoid descriptive terms** like "narrow" or "wide" — use numeric values.
- **Use `est_width=*` for estimates** — when the exact width is unknown or approximate, use `est_width=*` to signal uncertainty.

## Related Tags

- [est_width](https://wiki.openstreetmap.org/wiki/Key:est_width) — Estimated width when exact measurement is unavailable
- [maxwidth](https://wiki.openstreetmap.org/wiki/Key:maxwidth) — Maximum permitted vehicle width (restriction, not physical)
- [height](height.md) — Vertical dimension of a feature
- [lanes](lanes.md) — Number of traffic lanes (count, not width)
- [width:carriageway](https://wiki.openstreetmap.org/wiki/Key:width:carriageway) — Explicit carriageway width sub-tag
- [width:lanes](https://wiki.openstreetmap.org/wiki/Key:width:lanes) — Per-lane widths (semicolon-separated)

## See Also

- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:width)
