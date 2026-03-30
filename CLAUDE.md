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
bun run type-check     # TypeScript type checking (no emit)
bun run lint           # Check linting & type errors (ESLint + tsc)
bun run lint:fix       # Auto-fix ESLint issues (type errors must be fixed manually)
bun run format         # Format code
bun run format:check   # Check without modifying
```

## Documentation

Full docs in `docs/`. See `docs/README.md` for the complete index.

## Architecture

**Stack:** SolidJS · TypeScript · Three.js · Vite · Vitest · Bun

See [`package.json`](package.json) for current versions and [`docs/technical-stack.md`](docs/technical-stack.md) for architectural decisions.

**Core Components:**

- `src/App.tsx` - Orchestrates Viewer3D, AnimationLoop, DroneController, Drone, DroneObject, OriginManager (all initialized in onMount, disposed in cleanup)
- `src/3Dviewer/` - Wrapper pattern around Three.js (Camera, Scene, Renderer) with constructor injection for testing
- `src/drone/AnimationLoop.ts` - requestAnimationFrame loop, delta time (seconds), frame synchronization; starts/stops based on drone `movingChanged` event
- `src/drone/` - Drone physics (GeoCoordinates {lat, lng}), DroneController (keyboard + mouse input); Drone emits `locationChanged`, `azimuthChanged`, `elevationChanged`, `movingChanged` via TypedEventEmitter
- `src/gis/GeoCoordinates.ts` - Core geo math: `geoToLocal`, `getTileCoordinatesFromGeo`, `getTileGeoBounds`, `EARTH_RADIUS`
- `src/gis/OriginManager.ts` - Holds drone position as Three.js origin; `onChange`/`offChange` callbacks let `TerrainObjectManager` and `MeshObjectManager` reposition existing tiles on each drone move
- `src/data/shared/TileDataManager.ts` - Abstract base class for tile-based data managers; owns ring management logic (`setLocation`, `initializeTileRing`, `updateTileRing`, `dispose`), emits `tileAdded`/`tileRemoved` events
- `src/data/elevation/` - `ElevationDataManager` (tile caching, z:x:y keys, AWS Terrarium PNG), `ElevationDataTileLoader`, `ElevationDataTileParser`; `src/data/shared/tileLoaderUtils.ts` for cache-then-load pattern
- `src/data/contextual/` - `ContextDataManager` (Overture Maps PMTiles), `OvertureParser`, `featureBoundsFilter`
- `src/data/places/` - `interestingPlaces.ts`: curated landmark locations for the location search UI
- `src/visualization/terrain/` - TerrainGeometryObjectManager + TerrainTextureObjectManager → TerrainObjectManager → TerrainObjectFactory → Three.js meshes (orchestrated pipeline)
- `src/visualization/mesh/MeshObjectManager.ts` - Manages 3D mesh objects (buildings, vegetation, structures, barriers, bridges) per context tile; imports `registration.ts` to populate registry
- `src/visualization/drone/DroneObject.ts` - Drone 3D model in scene
- `src/visualization/TileObjectManager.ts` - Abstract base for all visual tile lifecycle managers; supports primary source + optional secondary rebuild sources
- `src/features/registry.ts` + `registration.ts` - `registry.ts` is the singleton registry of feature modules; `registration.ts` imports and registers all modules (building, road, railway, water, aeroway, structure, barrier, vegetation, landuse, bridge); dispatched by `TerrainCanvasRenderer` and `MeshObjectManager`
- `src/ui/` - SolidJS UI components: Header, LocationSearch (uses places data), PlacesModal, AttributionBar, Tooltip
- `src/config.ts` - Centralized config: drone position/speed, camera chase distance/height, elevation zoom/ring/concurrency

**Animation Frame Timing:** `AnimationLoop` (`src/drone/AnimationLoop.ts`) manages `requestAnimationFrame` timing and calls `drone.applyMove(deltaTime)` each frame. Subsequent data loading, mesh creation, and rendering are orchestrated via event subscriptions in `App.tsx` and triggered by drone movement—not controlled by AnimationLoop itself.

## Coordinate System: Geographic → Three.js (Local Tangent Plane)

See `docs/coordinate-system.md` for the full strategy document.

**Geographic → Three.js Position via `geoToLocal(lat, lng, elevation, origin)`:**

All positions are stored as `GeoCoordinates {lat, lng}` (WGS84 degrees). The drone is always at the Three.js origin. All scene objects are positioned relative to the drone using a local tangent plane:

```
X = east     → (lng - origin.lng) × cos(lat) × EARTH_RADIUS × π/180
Y = up       → elevation (direct)
Z = south    → -(lat - origin.lat) × EARTH_RADIUS × π/180
```

**Origin Rebasing**: `OriginManager` holds the drone's current `{lat, lng}`. On each frame, `geoToLocal()` converts all geo positions to local Three.js space relative to this origin. The drone mesh is always at `(0, elevation, 0)`.

**Coordinate Consistency** — all components must use the same convention:

1. **Position**: Use `geoToLocal(lat, lng, elevation, origin)` for all positioning
2. **Drone movement**: Great-circle displacement — `dLat = dNorth / EARTH_RADIUS / TO_RAD`, `dLng = dEast / (EARTH_RADIUS × cos(lat)) / TO_RAD`
3. **Object rotation.y**: `-azimuthRad` (clockwise azimuth → counterclockwise Three.js)
4. **Camera**: `lookAt` handles rotation automatically (no manual Euler angles)
5. **GeoJSON coordinates**: Always `[longitude, latitude]` order — destructure as `[lng, lat]`
6. **ElevationSampler**: `sampleAt(lat, lng)` — lat first, not GeoJSON order

**Key Patterns:**

- Constructor injection: 3D wrappers accept constructor functions (not instances) for DI
- Frame-rate independent physics: delta time in seconds
- Geographic coordinates with local tangent plane projection
- Factory pattern: `createDrone()`, TerrainGeometryFactory, TerrainObjectFactory
- Resource cleanup: all components have `dispose()`

**Testing (Vitest + happy-dom):**

- Tests colocated with `.test.ts` suffix
- Constructor injection: Pass mock constructor **classes** extending real Three.js classes
- `fake-indexeddb` for IndexedDB testing (tile persistence caches)
- happy-dom logs network errors from tile fetchers to stderr — these are noise, not real failures; a non-zero exit code from stderr alone can be ignored
