# OSM Tag Quick Reference

Complete listing of all 45 OSM tags.

## Building Tags (11 tags)

Core building structure and properties:

| Tag                | Link                                           | Purpose                      | Format     |
| ------------------ | ---------------------------------------------- | ---------------------------- | ---------- |
| building           | [building.md](building.md)                     | Identifies building elements | Enum       |
| building:type      | [building_type.md](building_type.md)           | Building classification      | Text/Enum  |
| building:part      | [building_part.md](building_part.md)           | Building component type      | Text/Enum  |
| building:levels    | [building_levels.md](building_levels.md)       | Floors above ground          | Integer    |
| building:min_level | [building_min_level.md](building_min_level.md) | Lowest floor number          | Integer    |
| building:material  | [building_material.md](building_material.md)   | Wall material                | Text/Enum  |
| building:colour    | [building_colour.md](building_colour.md)       | Wall color                   | Color/Text |
| height             | [height.md](height.md)                         | Total height in meters       | Decimal    |
| min_height         | [min_height.md](min_height.md)                 | Height to lowest feature     | Decimal    |

## Roof Tags (7 tags)

Roof-specific characteristics:

| Tag              | Link                                       | Purpose                    | Format     |
| ---------------- | ------------------------------------------ | -------------------------- | ---------- |
| roof:shape       | [roof_shape.md](roof_shape.md)             | Roof form                  | Enum       |
| roof:colour      | [roof_colour.md](roof_colour.md)           | Roof color                 | Color/Text |
| roof:material    | [roof_material.md](roof_material.md)       | Roof surface material      | Text/Enum  |
| roof:height      | [roof_height.md](roof_height.md)           | Roof height above building | Decimal    |
| roof:direction   | [roof_direction.md](roof_direction.md)     | Roof slope direction       | Degrees    |
| roof:orientation | [roof_orientation.md](roof_orientation.md) | Roof orientation           | Degrees    |

## Road Tags (5 tags)

Highway and surface properties:

| Tag     | Link                     | Purpose                 | Format       |
| ------- | ------------------------ | ----------------------- | ------------ |
| highway | [highway.md](highway.md) | Road/path type          | Enum         |
| surface | [surface.md](surface.md) | Road surface material   | Enum         |
| lanes   | [lanes.md](lanes.md)     | Number of traffic lanes | Integer      |
| bridge  | [bridge.md](bridge.md)   | Bridge indicator        | Enum/Boolean |
| width   | [width.md](width.md)     | Feature width in meters | Decimal      |

### Infrastructure Modifiers

Multi-purpose tags also used with roads:

| Tag        | Link                           | Purpose              | Format       |
| ---------- | ------------------------------ | -------------------- | ------------ |
| layer      | [layer.md](layer.md)           | 3D layering          | Integer      |
| tunnel     | [tunnel.md](tunnel.md)         | Tunnel indicator     | Enum/Boolean |
| tree_lined | [tree_lined.md](tree_lined.md) | Tree-lined indicator | Enum/Boolean |
| location   | [location.md](location.md)     | Feature location     | Enum         |

## Railway Tags (2 tags)

Railway infrastructure:

| Tag     | Link                     | Purpose          | Format       |
| ------- | ------------------------ | ---------------- | ------------ |
| railway | [railway.md](railway.md) | Railway type     | Enum         |
| gauge   | [gauge.md](gauge.md)     | Rail gauge in mm | Integer/Text |

## Water Tags (3 tags)

Water features and properties:

| Tag      | Link                       | Purpose            | Format  |
| -------- | -------------------------- | ------------------ | ------- |
| water    | [water.md](water.md)       | Water body type    | Enum    |
| waterway | [waterway.md](waterway.md) | Waterway type      | Enum    |
| level    | [level.md](level.md)       | Floor/level number | Integer |

## Vegetation Tags (7 tags)

Trees and natural areas:

| Tag            | Link                                   | Purpose                   | Format  |
| -------------- | -------------------------------------- | ------------------------- | ------- |
| natural        | [natural.md](natural.md)               | Natural feature type      | Enum    |
| leaf_type      | [leaf_type.md](leaf_type.md)           | Tree foliage type         | Enum    |
| leaf_cycle     | [leaf_cycle.md](leaf_cycle.md)         | Foliage seasonality       | Enum    |
| diameter_crown | [diameter_crown.md](diameter_crown.md) | Crown diameter in meters  | Decimal |
| circumference  | [circumference.md](circumference.md)   | Tree circumference at DBH | Decimal |
| landuse        | [landuse.md](landuse.md)               | Land use classification   | Enum    |
| leisure        | [leisure.md](leisure.md)               | Recreation area type      | Enum    |

## Infrastructure Tags (9 tags)

Man-made structures and utilities:

| Tag       | Link                         | Purpose                     | Format    |
| --------- | ---------------------------- | --------------------------- | --------- |
| man_made  | [man_made.md](man_made.md)   | Man-made structure type     | Enum      |
| power     | [power.md](power.md)         | Power infrastructure type   | Enum      |
| aerialway | [aerialway.md](aerialway.md) | Aerial transport type       | Enum      |
| aeroway   | [aeroway.md](aeroway.md)     | Airport infrastructure type | Enum      |
| barrier   | [barrier.md](barrier.md)     | Barrier type                | Enum      |
| material  | [material.md](material.md)   | Material composition        | Text/Enum |
| diameter  | [diameter.md](diameter.md)   | Diameter at breast height   | Decimal   |

## See Also

- [Master OSM Documentation Index](../README.md)
