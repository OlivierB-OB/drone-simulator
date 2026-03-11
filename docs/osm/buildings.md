**OSM Wiki:** https://wiki.openstreetmap.org/wiki/Buildings

# Buildings

## Description

Used to describe many different sorts of buildings, including houses, factories and ruined buildings.

## Key Tags

| Tag | Purpose |
|-----|---------|
| `building=*` | Primary tag for building type |
| `height=*` | Height in meters |
| `building:levels=*` | Number of visible floors |
| `roof:levels=*` | Number of roof levels |
| `name=*` | Building name |
| `entrance=*` | Entrance location/type |

## Core Tagging Principle

A single building outline should be created for each distinct building. For terraced houses, create linked outlines sharing nodes at boundaries to identify each property. The most basic tag is `building=yes`, but specific values like `building=house`, `building=garage`, or `building=school` are preferred.

**Important**: Building tags describe the physical structure itself, not current usage. For instance, `building=apartments` describes the architectural form, while `amenity=*` indicates actual current function.

## Building Categories

### Accommodation
- `apartments` - Multi-dwelling units
- `detached` - Free-standing residential
- `house` - Single-family dwelling
- `dormitory` - Student housing
- `hotel` - Overnight accommodation
- `houseboat` - Boat-based home
- `terrace` - Row houses
- `bungalow` - Single-story house

### Commercial
- `office` - Office building
- `retail` - Shop building
- `supermarket` - Self-service store
- `warehouse` - Storage/distribution
- `industrial` - Factory/industrial use
- `kiosk` - Small retail structure

### Religious
- `church` - Church building
- `mosque` - Mosque building
- `temple` - Temple building
- `chapel` - Chapel building
- `cathedral` - Cathedral building
- `synagogue` - Synagogue building
- `monastery` - Monastic building

### Civic/Amenity
- `school` - School building
- `hospital` - Hospital building
- `university` - University building
- `college` - College building
- `government` - Government offices
- `fire_station` - Fire department
- `train_station` - Rail station
- `museum` - Museum building
- `kindergarten` - Preschool facility

### Agricultural
- `barn` - Farm storage
- `stable` - Horse housing
- `cowshed` - Cattle housing
- `farm_auxiliary` - Non-dwelling farm building
- `greenhouse` - Plant growing structure
- `silo` - Bulk storage structure

### Sports
- `sports_hall` - Indoor sports facility
- `stadium` - Stadium building
- `pavilion` - Sports pavilion
- `grandstand` - Spectator stand
- `riding_hall` - Equestrian facility

### Storage
- `garage` - Vehicle storage
- `shed` - Workshop/storage
- `boathouse` - Boat storage
- `hangar` - Aircraft storage
- `hut` - Small shelter

### Other Notable Types
- `tower` - Tower building
- `ruins` - Abandoned/deteriorated
- `construction` - Under construction
- `container` - Container structure
- `castle` - Castle building
- `bunker` - Military building

## Additional Attributes

| Key | Values | Notes |
|-----|--------|-------|
| `building:material` | Material type | Outer facade material |
| `building:colour` | Color code or name | Building color |
| `building:flats` | Number | Count of residential units |
| `building:fireproof` | yes/no | Fire resistance |
| `entrance` | yes/main/exit/service/emergency | Entrance type on node |
| `height` | Number (meters) | Building height |
| `construction_date` | Date | When completed |
| `building:architecture` | Style | Architectural style |

## Mapping Guidelines

### Polygon Mapping
- Trace accurate building outlines from aerial imagery
- For rectangular buildings, use orthogonalization (JOSM shortcut: Q)
- Use multipolygons for interior courtyards
- Don't oversimplify curved structures

### Address Information
Consider adding to nodes marking entrances:
- `entrance=yes`
- `addr:street=*`
- `addr:housenumber=*`
- `addr:postcode=*`
- `addr:city=*`

### Addressing POIs
`building=retail` simply indicates a structure built for retail, not necessarily an active shop. Tag actual uses with `shop=*` or `amenity=*` separately.

## Important Notes

### Don't Tag for the Renderer
Map attributes as close to reality as possible using available data. Don't creatively reinterpret tags or delete/modify data to achieve desired map rendering.

### Avoid Misuse
- Don't tag temporary structures (tents, containers used during construction)
- Don't tag statues, bridge piers, or similar non-building objects as buildings
- Don't use amenity tags simply to emphasize rendering

## 3D and Indoor Mapping

- Use **Simple 3D Buildings** for 3D modeling with backwards compatibility
- Apply **Simple Indoor Tagging** for interior features
- Tag floor information with `building:levels`, `min_level`, and `max_level`

## Tools and Resources

- **JOSM**: BuildingsTools plugin (hotkey: B), Terracer plugin for rows
- **Potlatch**: Copy properties between similar buildings quickly
- **Mapping sources**: Aerial imagery (Bing, etc.), GPS traces, street-level surveys
