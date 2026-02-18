# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Together Rules

- **Simplicity first**: Prefer simple solutions. KISS principle.
- **Low verbosity**: Say what matters. Avoid noise.
- **Be honest**: Tell important truths even if unwelcome. No flattery.
- **Mutual accountability**: Help avoid mistakes together.
- **Full agency**: Push back if something seems wrong. Don't just agree.
- **Flag early**: Call out unclear/risky points before they become problems.
- **Ask, don't guess**: Clarify important decisions. Don't choose randomly.
- **I don't know**: Say it instead of making things up.
- **Call out misses**: Start with ❗️ when showing errors or gaps.

## Design Patterns

- **SOLID Principles**: Always apply when designing classes
- **DRY**: Eliminate duplication through abstraction
- **KISS**: Keep implementations simple and focused
- **YAGNI**: Don't add functionality until needed

## Commands

```bash
# Setup & run
bun install
bun run dev          # Dev server: http://localhost:3000
bun run preview      # Production build preview

# Testing (Vitest + happy-dom)
bun run test              # Run all tests
bun run test:ui           # Interactive UI
bun run test:coverage     # Coverage reports
bun run test src/drone/Drone.test.ts  # Single file

# Quality
bun run build          # Production build → dist/
bun run lint           # Check issues
bun run lint:fix       # Auto-fix
bun run format         # Format code
bun run format:check   # Check without modifying
```

## Architecture

**Stack:** SolidJS 1.9 · TypeScript 5.9 · Three.js 0.160 · Vite 7.3 · Vitest 4.0 · Bun

**Core Components:**
- `src/App.tsx` - Orchestrates Viewer3D, AnimationLoop, DroneController, Drone, DroneObject (all initialized in onMount, disposed in cleanup)
- `src/3Dviewer/` - Wrapper pattern around Three.js (Camera, Scene, Renderer) with constructor injection for testing
- `src/core/AnimationLoop.ts` - requestAnimationFrame loop, delta time (seconds), frame synchronization
- `src/drone/` - Drone physics (Mercator coordinates), DroneController (keyboard input, arrow keys)
- `src/data/` - ElevationDataManager (tile caching, Web Mercator zoom, z:x:y keys, AWS Terrarium PNG), ContextDataManager (placeholder)
- `src/visualization/terrain/` - TerrainGeometryObjectManager → TerrainObjectManager → Three.js meshes (two-stage pipeline)
- `src/visualization/DroneObject.ts` - Cone mesh representing the drone in the scene
- `src/config.ts` - Centralized config: drone position/speed, camera chase distance/height, elevation zoom/ring/concurrency

**Animation Frame Order:**
1. `drone.applyMove(deltaTime)` - Update location/heading (respects drone heading)
2. `elevationData.setLocation()` - Load/unload tiles in ring around drone
3. `contextData.setLocation()` - Update context
4. `terrainObjectManager.refresh()` - Create/remove Three.js meshes in scene
5. `droneObject.update()` - Position and orient the drone cone mesh
6. `camera.updateChaseCamera()` - Position camera behind and above drone, lookAt drone
7. `viewer3D.render()`

## Coordinate System: World → Three.js Conversion

**Critical:** See `COORDINATE_SYSTEM.md` for the full strategy document.

### World Coordinates (Mercator)
```
Location.x  = Mercator X (east-west, increases eastward)
Location.y  = Mercator Y (north-south, INCREASES NORTHWARD - standard Web Mercator)
Elevation   = Meters above sea level (vertical)
Azimuth     = Compass bearing in degrees (0°=North, 90°=East, clockwise positive)
```

### Three.js Coordinates
```
position.x  = Mercator X (East = +X)
position.y  = Elevation (Up = +Y)
position.z  = -Mercator Y (North = -Z)
rotation.y  = -azimuthRad (counterclockwise positive, opposite of clockwise azimuth)
```

### Conversion Formula

**Mercator → Three.js Position:**
```typescript
threeX = mercator.x       // Direct
threeY = elevation         // Direct
threeZ = -mercator.y       // Negated (Mercator Y northward → Three.js -Z northward)
```

**Movement Calculation:** `Drone.ts:110-118`
```typescript
// Forward/backward (along drone's heading)
// No negation needed: Mercator Y increases northward, cos(0°)=+1 moves north
x: Math.sin(azimuthRad) * netForward * displacement,
y: Math.cos(azimuthRad) * netForward * displacement,

// Left/right (perpendicular to heading)
x: Math.sin(rightAzimuthRad) * netRight * displacement,
y: Math.cos(rightAzimuthRad) * netRight * displacement,
```

**Chase Camera:** `Camera.ts`
```typescript
// Camera behind drone: opposite of forward direction + height offset
behindX = droneX - sin(azimuthRad) * chaseDistance
behindZ = droneZ + cos(azimuthRad) * chaseDistance
aboveY  = droneY + chaseHeight
camera.lookAt(droneX, droneY, droneZ)  // Orientation handled by lookAt
```

### Why Z = -Mercator.Y

Mercator Y increases **northward** (standard projection). Three.js default camera looks along -Z. By mapping Z = -Y:
- North (increasing Mercator Y) = decreasing Z = -Z direction = camera's default forward
- This makes azimuth 0 (North) align with the default Three.js viewing direction

### Coordinate Consistency

All components must use the same convention:
1. **Position Z**: `-mercator.y` (camera, terrain meshes, axes helper, drone object)
2. **Movement Y**: `+cos(azimuthRad)` (no negation, Mercator Y increases northward)
3. **Object rotation.y**: `-azimuthRad` (clockwise azimuth → counterclockwise Three.js)
4. **Camera**: `lookAt` handles rotation automatically (no manual Euler angles)

**Key Patterns:**
- Constructor injection: 3D wrappers accept constructor functions (not instances) for DI
- Frame-rate independent physics: delta time in seconds
- Mercator projection for GPS coordinates
- Factory pattern: `createDrone()`, TerrainGeometryFactory, TerrainObjectFactory
- Resource cleanup: all components have `dispose()`

**Testing (Vitest + happy-dom):**
- Tests colocated with `.test.ts` suffix
- Constructor injection: Pass mock constructor **classes** extending real Three.js classes
- Example: Camera verifies call with `(75, width/height, 0.1, 1000)`
- 3D Viewer: wrapper initialization & injection
- Drone: physics, movement, Mercator edge cases, controller cleanup
- AnimationLoop: frame timing, delta time, integration
- Terrain: geometry creation, tile sync, lifecycle
