# barrier

**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Key:barrier

## Definition
Specifies physical barriers and boundaries including walls, fences, hedges, and other access control structures.

## Data Type
String value representing the barrier type. Applied to ways (lines) and sometimes nodes.

## Common Barrier Types

**Walls:**
- `wall` - Generic wall
- `city_wall` - Historic fortification wall
- `retaining_wall` - Retaining/support wall
- `historic` - Historic wall structure
- `dike` - Water management dike/levee

**Fences:**
- `fence` - Generic fence
- `hedge` - Living hedge barrier
- `railing` - Railing/guardrail
- `cable_barrier` - Cable safety barrier
- `chain` - Chain barrier

**Gates/Access:**
- `gate` - Gate entrance
- `bollard` - Bollard post
- `turnstile` - Turnstile gate
- `stile` - Stile/step-over gate

**Specialized:**
- `border_control` - International border checkpoint
- `spikes` - Anti-vehicle spikes
- `kerb` - Curb/curbing
- `embankment` - Raised embankment

## Usage Notes

- Applied to ways (linear features)
- Use with `height` for vertical dimension
- Use with `width` or `thickness` for horizontal dimension
- `material` tag specifies construction material
- `colour` or `color` for visual properties
- `access` may specify restrictions

## Related Tags
- `height` - Barrier height in meters
- `width` or `thickness` - Barrier width/thickness
- `material` - Construction material
- `colour` / `color` - Visual color
- `man:made` - Man-made structure classification
- `location` - Placement (on top of, etc.)
- `access` - Access restriction type

## See Also
- [OSM Key Tag Documentation](https://wiki.openstreetmap.org/wiki/Key:barrier)
- [material tag documentation](material.md)
- [man:made tag documentation](man_made.md)
