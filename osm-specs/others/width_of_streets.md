# Width of Streets

Source: https://wiki.openstreetmap.org/wiki/Key:width#Width_of_streets

---

## Definition

`width=*` describes the **carriageway width kerb-to-kerb** (or edge-to-edge for unpaved roads).

**Includes:** cycle lanes and parking lanes if they are physically on the street.
**Excludes:** sidewalks, separate cycle paths, off-street parking areas.

> **Note:** For a long time there was no consensus on this definition, so data consumers
> should expect some fuzziness in older mapped values.

---

## Units and Format

- Default unit: **metres** (no suffix needed, e.g. `width=6.5`)
- Decimal separator: **period** (not comma)
- Optional units require a space before the unit: `width=16 ft`, `width=0.6 mi`, `width=16'3"`

---

## Related Tags

| Tag | Meaning |
|-----|---------|
| `width:carriageway=*` | Explicit carriageway width — now treated identically to `width=*` |
| `lanes=*` | Number of traffic lanes (can derive estimate: lanes × 3.5 m) |
| `width:lanes=*` | Individual lane widths |
| `cycleway:side:width=*` | Cycle path width when mapped on the roadway |
| `sidewalk:side:width=*` | Sidewalk width |
| `parking:left/right/both:width=*` | Parking lane widths |
| `shoulder:width=*` | Shoulder width |

---

## Typical Fallback Widths

Use when no `width=*` tag is present. Values are typical real-world widths based on
standard road design norms.

| highway=* | Typical width (m) |
|-----------|------------------|
| `motorway`, `trunk` | 20–30 |
| `motorway_link`, `trunk_link` | 8–14 |
| `primary` | 12–16 |
| `primary_link` | 6–9 |
| `secondary` | 8–12 |
| `secondary_link` | 5–7 |
| `tertiary` | 6–9 |
| `tertiary_link` | 4–6 |
| `residential`, `unclassified` | 5–7 |
| `service` | 3–5 |
| `living_street` | 4–6 |
| `pedestrian` | 4–10 |
| `footway`, `path` | 1–3 |
| `cycleway` | 1.5–3 |
| `track` | 3–5 |
| `bridleway` | 2–4 |

---

## Canvas Pixel Conversion

To convert a real-world width (metres) to canvas pixels:

```
pixelWidth = metersWidth × (canvasSize / tileRealWorldSize)
```

where `tileRealWorldSize` is the ground footprint of the tile in metres at the current
zoom level — the same scale factor used for terrain mesh geometry.
