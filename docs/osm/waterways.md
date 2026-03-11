**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Waterways

# Waterways

## Description

Areas of water including rivers, canals, streams, lakes and reservoirs.

## Primary Tags

- `waterway=river`
- `waterway=stream`
- `waterway=tidal_channel`
- `waterway=canal`
- `waterway=ditch`
- `waterway=drain`
- `waterway=flowline`
- `waterway=pressurised`
- `natural=water`
- `water=*`

## Linear Water Features

Rivers, canals and streams should be represented as linear ways pointing in the direction of water flow, creating a routable network connecting related features.

### Natural Waterways
- `waterway=river`
- `waterway=stream`
- `waterway=tidal_channel`

### Artificial Waterways
- `waterway=canal`
- `waterway=drain`
- `waterway=ditch`
- `waterway=pressurised` (for pipe flow under pressure)

## Additional Tags

- `tidal=yes` for tidal sections
- `seasonal=*` for yearly cycles
- `intermittent=yes` for intermittent sections
- `natural=spring` on starting nodes
- `name=*` for watercourse names
- `wikipedia=*` for related pages
- `usage=*` for purpose of man-made waterways

## Wide Rivers, Lakes & Reservoirs

Use area features with:
- `natural=water` + `water=river` for river areas
- `natural=water` + `water=lake` for lakes
- `natural=water` + `water=reservoir` for reservoirs
- `waterway=dock` for shipping areas with lock-gates

## Man-Made Structures

- Bridge over water: `bridge=yes`, `layer=1`
- Water under road: `tunnel=culvert`, `layer=-1`
- Aqueduct: `bridge=aqueduct`
- Water pipeline: `man_made=pipeline`, `waterway=pressurised`
- Piers: `man_made=pier`

## Related Infrastructure

- Water works: `man_made=water_works`
- Water towers: `man_made=water_tower`
- Sewage treatment: `man_made=wastewater_plant`
- Hydroelectric: `power=generator`, `generator:source=hydro`
- Stream gauges: `man_made=monitoring_station`
