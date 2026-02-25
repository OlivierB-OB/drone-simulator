# Key: `layer` — Vertical Layer

> Source: https://wiki.openstreetmap.org/wiki/Key:layer

## Description

The `layer=*` tag describes the vertical ordering of features that cross or overlap at the same geographic location. It establishes which feature passes above or below another without requiring them to share nodes.

Features without an explicit `layer` tag default to layer `0`. The tag conveys relative ordering, not absolute altitude — use `height=*` or `ele=*` for physical measurements.

## Element Types

- **Nodes / ways / areas / relations**: may be used

## Values

Numerical integers in the range **−5 to 5**. `layer=0` is the default and should not be tagged explicitly.

| Value | Meaning |
|-------|---------|
| `1`, `2`, … | Above ground (bridges, elevated roads) |
| `-1`, `-2`, … | Below ground (tunnels, underpasses) |

## Status

De facto

---

## Usage Conventions

Always pair `layer` with the appropriate structural modifier tag:

| Situation | Tags |
|-----------|------|
| Simple road bridge | `bridge=yes` + `layer=1` |
| Flyover bridge | `bridge=yes` + `layer=2` |
| Road tunnel | `tunnel=yes` + `layer=-1` |
| Elevated railway | `bridge=yes` + `layer=1` on `railway=*` |
| Underground railway | `tunnel=yes` + `layer=-1` on `railway=*` |
| Building over road | `building:part=*` + `layer=1` |

## Level vs. Layer vs. Location

These three tags are commonly confused. Each has a distinct purpose:

| Tag | Question answered | Typical use |
|-----|-------------------|-------------|
| `level=*` | Which floor inside a building? | Indoor features (shops, corridors, platforms) |
| `layer=*` | Which feature is on top at a crossing? | Bridges, tunnels, overlapping roads/rails |
| `location=*` | Is the feature physically underground/overhead? | Buried infrastructure, overhead cables |

- `layer=-1` does **not** mean underground on its own — it is a crossing-order hint. Use `location=underground` or `tunnel=yes` to signal that a feature should be hidden.
- `level=*` applies to features inside structures, not to outdoor ways.

## Rendering Stacking Order

`layer` reorders features within the same rendering group. It does not override the natural feature hierarchy (e.g. water always draws before roads). The approximate stacking, from bottom to top:

1. Underground / tunnels (`layer < 0`)
2. Landcover, water bodies
3. Waterways
4. Roads and railways (ground level, `layer=0`)
5. Buildings
6. Bridges and elevated features (`layer > 0`)

When two features in the same group share the same `layer` value, they are treated as at-grade (co-planar).

## Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| `layer=-1` on a road to hide it from rendering | Add `tunnel=yes` or `location=underground` |
| `layer=*` on landuse or park areas | Layer does not apply to area landcover |
| Assigning layer based on physical elevation | Use `ele=*` or `height=*` for altitude |
| Long viaducts/tunnels with varying layer values | Use a single layer value for the whole way |

## Notes

- Negative `layer` values do not automatically imply underground — use `location=underground` for that.
- When two features cross at the same layer value they are treated as at-grade (sharing surface level).
- The tag is almost always combined with `bridge=*`, `tunnel=*`, `covered=*`, or `indoor=yes`.

## See Also

- [level.md](level.md) — floor numbering inside structures
- [location.md](location.md) — physical placement (underground, overhead)
- [bridge.md](bridge.md) — bridge modifier tag
