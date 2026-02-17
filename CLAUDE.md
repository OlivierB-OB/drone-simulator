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
- `src/App.tsx` - Orchestrates Viewer3D, AnimationLoop, DroneController, Drone (all initialized in onMount, disposed in cleanup)
- `src/3Dviewer/` - Wrapper pattern around Three.js (Camera, Scene, Renderer) with constructor injection for testing
- `src/core/AnimationLoop.ts` - requestAnimationFrame loop, delta time (seconds), frame synchronization
- `src/drone/` - Drone physics (Mercator coordinates), DroneController (keyboard input, arrow keys)
- `src/data/` - ElevationDataManager (tile caching, Web Mercator zoom, z:x:y keys, AWS Terrarium PNG), ContextDataManager (placeholder)
- `src/visualization/terrain/` - TerrainGeometryObjectManager → TerrainObjectManager → Three.js meshes (two-stage pipeline)
- `src/config.ts` - Centralized config: drone position/speed, elevation zoom/ring/concurrency, GIS

**Animation Frame Order:**
1. `drone.applyMove(deltaTime)` - Update location/heading (respects drone heading)
2. `elevationData.setLocation()` - Load/unload tiles in ring around drone
3. `contextData.setLocation()` - Update context
4. `terrainGeometryManager.refresh()` - Create geometry from loaded tiles (z:x:y keyed)
5. `terrainObjectManager.refresh()` - Create/remove Three.js meshes in scene
6. Position camera (5m above drone)
7. `viewer3D.render()`

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
