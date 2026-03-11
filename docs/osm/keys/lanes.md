# lanes

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:lanes

## Definition
Specifies the number of traffic lanes (one direction of travel) on a road. For two-way roads without a median, the total number of lanes in both directions is counted together.

## Data Type
Integer value representing the count of lanes. Applied to ways (roads).

## Format
- **Basic:** `lanes=*` where * is an integer number
- **Examples:** `lanes=2`, `lanes=3`, `lanes=4`, `lanes=6`

## Common Lane Values

**Single Lane:**
- `lanes=1` - Single lane roads (narrow residential, paths)

**Two Lanes (Common):**
- `lanes=2` - Standard two-way two-lane roads (one lane each direction)

**Three/Four Lanes:**
- `lanes=3` - Asymmetric: one direction has two lanes, other has one
- `lanes=4` - Four lanes total: two in each direction (with or without median)

**Six or More Lanes:**
- `lanes=6`, `lanes=8` - Major highways, expressways, motorways

## Usage Notes

- Count all lanes in both directions (not per-direction)
- For divided highways with a median, count each side separately using modifiers
- Does not include shoulders, turn lanes, or cycle lanes (use separate tags)
- Applies to highways from `residential` class and above
- May vary by section or time of day; use most common value

## Related Tags
- `highway` - Road type classification
- `oneway` - One-way traffic direction
- `turn:lanes` - Turning lanes per direction
- `lanes:forward` - Lanes in positive direction
- `lanes:backward` - Lanes in negative direction
- `width` - Total road width in meters
- `maxspeed` - Speed limit

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:lanes)
- [highway tag documentation](highway.md)
