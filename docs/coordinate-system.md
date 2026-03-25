# Coordinate System & Rendering Strategy

## World Representation

| Property | Type | Description |
|----------|------|-------------|
| **Location** | `GeoCoordinates {lat, lng}` | WGS84 geographic coordinates (degrees) |
| **Azimuth** | `number` (degrees) | Compass heading: 0=North, 90=East, 180=South, 270=West |
| **Elevation** | `number` (meters) | Altitude above sea level |

## Geographic Coordinates (WGS84)

All positions are stored as `GeoCoordinates {lat, lng}` in degrees:
- **lat** increases northward (−90 to +90)
- **lng** increases eastward (−180 to +180)

## Local Tangent Plane: geoToLocal()

Three.js requires Cartesian (metric) coordinates. `geoToLocal(lat, lng, elevation, origin)`
projects a geographic point onto a local tangent plane centered at `origin` (the drone's position):

```
X = (lng - origin.lng) × cos(origin.lat) × EARTH_RADIUS × π/180   // east → +X
Y = elevation                                                        // up → +Y
Z = -(lat - origin.lat) × EARTH_RADIUS × π/180                      // north → -Z
```

The drone is always at `(0, elevation, 0)`. All scene objects are expressed as metric offsets from the drone.

## Origin Rebasing (OriginManager)

`OriginManager` holds the drone's current `{lat, lng}` as the Three.js world origin.

- When the drone moves, `OriginManager.setOrigin(newGeo)` is called.
- Subscribers (`TerrainObjectManager`, `MeshObjectManager`) register via `onChange()` and **reposition all existing tile meshes** by calling `geoToLocal(tileCenter, newOrigin)` for each tile.
- Newly created tiles are positioned with the current origin at creation time.
- `setOrigin()` short-circuits when `lat` and `lng` are unchanged, so subscribers are not notified on idle frames.

This keeps the drone at `(0, elevation, 0)` while the world moves around it.

## Direction Vectors in Three.js

For a given azimuth (in radians):

```
Forward = (sin(azimuth), 0, -cos(azimuth))
Right   = (cos(azimuth), 0,  sin(azimuth))
```

Verification:
- Azimuth 0 (North): forward = (0, 0, −1) = −Z direction ✓
- Azimuth 90 (East): forward = (1, 0, 0) = +X direction ✓

## Object Rotation

Azimuth increases clockwise (compass), but Three.js `rotation.y` increases counterclockwise:

```
rotation.y = -azimuthRad
```

## Drone Movement (Great-Circle Displacement)

```
dNorth = (cos(azimuth) × netForward + cos(azimuth + π/2) × netRight) × speed × dt
dEast  = (sin(azimuth) × netForward + sin(azimuth + π/2) × netRight) × speed × dt

lat += dNorth / EARTH_RADIUS / (π/180)
lng += dEast  / (EARTH_RADIUS × cos(lat × π/180)) / (π/180)
```

Speed is 15 m/s (configured in `src/config.ts`).

## Chase Camera

```
cameraX = 0 - sin(azimuth) × chaseDistance
cameraY = droneElevation + chaseHeight
cameraZ = 0 + cos(azimuth) × chaseDistance
camera.lookAt(0, droneElevation, 0)
```

The drone is always at `(0, elevation, 0)`, so the camera is offset from the origin. `lookAt` handles all rotation automatically.

## Controls

| Input | Action |
|-------|--------|
| Up arrow | Move forward (along heading) |
| Down arrow | Move backward (opposite heading) |
| Left arrow | Strafe left (perpendicular to heading) |
| Right arrow | Strafe right (perpendicular to heading) |
| Mouse left/right | Rotate heading (azimuth) |
| Mouse wheel up | Increase elevation |
| Mouse wheel down | Decrease elevation |

## Terrain Tile Positioning

Each terrain tile is a single `THREE.Mesh` positioned at its geographic center:

```typescript
const pos = geoToLocal(centerLat, centerLng, 0, origin);
mesh.position.set(pos.x, pos.y, pos.z);
```

When origin changes (drone moves), `TerrainObjectManager` repositions all existing tiles using their stored `GeoBounds`.

## Feature Mesh Positioning (3D Objects)

Feature tiles (buildings, barriers, vegetation, etc.) are wrapped in a `THREE.Group` per tile:

```typescript
// Group at tile center:
group.position.set(geoToLocal(tileCenterLat, tileCenterLng, 0, origin));

// Features inside group, relative to tile center:
mesh.position.set(geoToLocal(featureLat, featureLng, elev, tileCenter));
```

When origin changes, `MeshObjectManager` repositions each group's position from its stored `GeoBounds` — feature mesh local positions within the group are unchanged.
