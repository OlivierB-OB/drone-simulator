# Key: `level` — Floor Level

> Source: https://wiki.openstreetmap.org/wiki/Key:level

## Description

The `level=*` tag indicates which floor of a structure a feature occupies. It uses zero-based numbering: ground floor is `0`, floors above are positive integers, and floors below ground are negative integers.

Used mainly for indoor mapping (shops, corridors, platforms, amenities). Distinct from `layer=*` (vertical ordering at crossings) and `location=*` (physical placement of the feature itself).

## Element Types

- **Nodes / ways / areas / relations**: may be used

## Values

| Value | Meaning |
|-------|---------|
| `0` | Ground floor |
| `1`, `2`, … | Floors above ground |
| `-1`, `-2`, … | Basement / underground floors |
| `0;1` | Feature spanning two floors (semicolon-separated) |
| `-2-32` | Feature spanning a range of floors (hyphen-separated range) |

## Status

De facto

---

## Companion Tags

| Tag | Purpose |
|-----|---------|
| `level:ref=*` | Non-numeric floor label used in the building (e.g. `B`, `G`, `M`, `4A`) |
| `non_existent_levels=*` | Lists skipped floor numbers (e.g. `13` in USA) |
| `repeat_on=*` | Identical rooms repeated across multiple floors |
| `addr:floor=*` | Floor label on a postal address |

## Relation to Other Tags

| Tag | Purpose | When to use |
|-----|---------|-------------|
| `level=*` | Floor index inside a structure | Indoor features on a specific floor |
| `layer=*` | Vertical order at crossings | Bridges, tunnels, overlapping roads |
| `location=underground` | Feature is physically buried | Infrastructure without explicit tunnel structure |

## Notes

- `level=0` is always the ground floor regardless of local floor-naming conventions.
- Partially buried buildings: `level=0` is the lowest level with any above-ground exposure.
- `building:levels=*` counts the total above-ground floors of the whole building — separate concept.
- Mezzanines: `level=0.5` is used but not standardised; treat as ground level (`0`) when unsure.

---

## Rendering Implication

| Condition | Rendering |
|-----------|-----------|
| `level ≥ 0` | Rendered normally (at or above ground) |
| `level < 0` | Not rendered — feature is in a basement or underground floor |

`level=*` mainly appears on indoor-mapped features (shops, corridors, metro platforms). Because the drone view is aerial and exterior, these features are already hidden by the building shell. The level tag provides a secondary confirmation: any feature with `level < 0` is below ground and must be excluded from rendering regardless of other tags.
