# Coordinate System & Rendering Strategy

## World Representation

Every world object is described by three properties:

| Property | Type | Description |
|----------|------|-------------|
| **Location** | `MercatorCoordinates {x, y}` | Position in Web Mercator projection (meters) |
| **Azimuth** | `number` (degrees) | Compass heading: 0=North, 90=East, 180=South, 270=West |
| **Elevation** | `number` (meters) | Altitude above sea level |

## Mercator Coordinates

Standard Web Mercator projection (EPSG:3857):

- **X** increases **eastward**
- **Y** increases **northward**
- Origin at (0, 0) = intersection of equator and prime meridian
- Paris (48.853N, 2.350E) = approximately (261,700 , 6,250,000)

Conversion from latitude/longitude:

```
x = longitude * PI / 180 * EarthRadius
y = ln(tan((90 + latitude) * PI / 360)) * EarthRadius
```

## Three.js Coordinate Mapping

Three.js uses a right-handed coordinate system. The mapping from Mercator:

```
Three.js X = Mercator X         (East = +X)
Three.js Y = Elevation          (Up = +Y)
Three.js Z = -Mercator Y        (North = -Z)
```

The Z negation is required because Mercator Y increases northward, but Three.js convention has the default camera looking along -Z. This makes North align with the default "forward" direction.

### Direction Vectors in Three.js

For a given azimuth angle (in radians):

```
Forward = (sin(azimuth), 0, -cos(azimuth))
Right   = (cos(azimuth), 0,  sin(azimuth))
Behind  = (-sin(azimuth), 0, cos(azimuth))
```

Verification:
- Azimuth 0 (North): forward = (0, 0, -1) = -Z direction
- Azimuth 90 (East): forward = (1, 0, 0) = +X direction

### Object Rotation

Azimuth increases clockwise (viewed from above), but Three.js `rotation.y` increases counterclockwise. Therefore:

```
rotation.y = -azimuthRad
```

## Drone Movement

Movement in Mercator space (no negation needed since Y increases northward):

```
Forward:
  location.x += sin(azimuth) * speed * deltaTime
  location.y += cos(azimuth) * speed * deltaTime

Right (strafe):
  rightAzimuth = azimuth + PI/2
  location.x += sin(rightAzimuth) * speed * deltaTime
  location.y += cos(rightAzimuth) * speed * deltaTime
```

## Chase Camera

The camera is positioned behind and above the drone, looking at it.

```
cameraX = droneThreeX - sin(azimuth) * chaseDistance
cameraY = droneThreeY + chaseHeight
cameraZ = droneThreeZ + cos(azimuth) * chaseDistance
camera.lookAt(droneThreeX, droneThreeY, droneThreeZ)
```

The `lookAt` call handles all rotation automatically -- no manual Euler angle math needed.

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

## Terrain Mesh Positioning

Terrain tiles are positioned consistently with the same mapping:

```
mesh.position.x = (bounds.minX + bounds.maxX) / 2    // Mercator X center
mesh.position.y = 0                                   // Ground level
mesh.position.z = -((bounds.minY + bounds.maxY) / 2)  // -Mercator Y center
```
