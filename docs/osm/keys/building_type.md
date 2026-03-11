# building:type

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:building:type

## Definition

**Deprecated.** The `building:type=*` key was historically used to classify building types but has been superseded by the `building=*` key with typed values (e.g., `building=church`, `building=warehouse`).

This tag should not be used on new data. Existing data tagged with `building:type=*` remains in the database but automated mass conversion is discouraged per OSM's Automated Edits code of conduct.

## Data Type

Text — formerly a building classification value, now obsolete.

## Recommended Alternative

Use `building=*` with a specific value instead:

```
building=house
building=apartment
building=church
building=warehouse
```

See [building](building.md) for the full list of 191+ valid values.

## Related Tags

- [building](building.md) — Current replacement for this tag
- [building:part](building_part.md) — For sub-components of a building

## See Also
- [Tag Quick Reference](README.md)
- [OSM Key Documentation](https://wiki.openstreetmap.org/wiki/Key:building:type)
