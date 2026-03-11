# power

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:power

## Definition
Specifies electric power infrastructure elements including generation, transmission, and distribution facilities.

## Data Type
String value representing the power infrastructure type. Applied to nodes, ways, and areas.

## Common Power Infrastructure Types

**Generation:**
- `plant` - Power plant
- `generator` - Individual generator unit
- `wind_turbine` - Wind energy generator
- `solar_panel` - Solar array

**Transmission/Distribution:**
- `pole` - Utility pole/pylon
- `tower` - Transmission tower
- `line` - Power line (ways)
- `cable` - Underground cable

**Substations:**
- `substation` - Electrical substation
- `transformer` - Transformer unit
- `meter` - Metering device

**Other:**
- `junction` - Power junction/connection point
- `switchgear` - Switching equipment
- `switch` - Individual switch

## Usage Notes

- Applied to nodes, ways (lines), and areas (substations)
- Lines (power=line) mapped as ways
- Use with `height` for tower/pole dimensions
- `voltage` tag specifies electrical characteristics
- `frequency` indicates AC frequency
- `operator` specifies managing utility company

## Related Tags
- `man:made` - General man-made structure classification
- `height` - Structure height in meters
- `voltage` - Electrical voltage level (kV)
- `frequency` - AC power frequency (Hz)
- `operator` - Utility operator name
- `layer` - Z-ordering for overlapping features
- `underground` - Underground line indicator
- `cables` - Number of cables

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:power)
- [man:made tag documentation](man_made.md)
- [material tag documentation](material.md)
