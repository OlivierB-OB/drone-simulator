# Drone Simulator

A 3D drone simulator web application built with SolidJS, Three.js, TypeScript, Vite, ESLint, and Prettier.

## Prerequisites

- [Bun](https://bun.com) v1.3.9 or later

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

The app will be available at `http://localhost:3000`

### Build

Create an optimized production build:

```bash
bun run build
```

The output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
bun run preview
```

## Code Quality

### Linting

Check for code quality issues:

```bash
bun run lint
```

Auto-fix linting issues:

```bash
bun run lint:fix
```

### Formatting

Format code with Prettier:

```bash
bun run format
```

Check formatting without modifying files:

```bash
bun run format:check
```

## Architecture & Animation Frame

**Core Initialization** (`src/App.tsx`):
All systems are initialized in `onMount` and properly disposed in cleanup:
- Viewer3D, AnimationLoop, DroneController, Drone, ElevationDataManager, TerrainGeometryObjectManager, TerrainObjectManager

**Animation Frame Order**:
1. `drone.applyMove(deltaTime)` - Update location/heading (respects drone heading)
2. `elevationData.setLocation()` - Load/unload tiles in ring around drone
3. `contextData.setLocation()` - Update context
4. `terrainGeometryManager.refresh()` - Create geometry from loaded tiles (z:x:y keyed)
5. `terrainObjectManager.refresh()` - Create/remove Three.js meshes in scene
6. Position camera (5m above drone)
7. `viewer3D.render()`

**Key Patterns**:
- Constructor injection: 3D wrappers accept constructor functions (not instances) for dependency injection
- Frame-rate independent physics: delta time in seconds
- Mercator projection: GPS coordinates mapped to Web Mercator zoom
- Factory pattern: `createDrone()`, TerrainGeometryFactory, TerrainObjectFactory
- Resource cleanup: all components have `dispose()` methods

## Project Structure

```
drone-simulator/
├── src/
│   ├── index.tsx                 # SolidJS entry point
│   ├── App.tsx                   # Main application component (orchestrates all systems)
│   ├── config.ts                 # Centralized config (drone, elevation, GIS)
│   ├── 3Dviewer/                 # Three.js rendering wrapper
│   │   ├── Viewer3D.ts
│   │   ├── Camera.ts
│   │   ├── Scene.ts
│   │   └── Renderer.ts
│   ├── core/                     # Core systems
│   │   └── AnimationLoop.ts      # requestAnimationFrame loop, delta time (seconds)
│   ├── drone/                    # Drone simulation
│   │   ├── Drone.ts              # Drone physics (Mercator coordinates)
│   │   └── DroneController.ts    # Keyboard input (arrow keys)
│   ├── data/                     # Data management
│   │   ├── ElevationDataManager.ts  # Tile caching, AWS Terrarium PNG
│   │   └── ContextDataManager.ts    # Placeholder for context data
│   ├── gis/                      # Geographic utilities
│   │   └── Mercator projection helpers
│   ├── visualization/            # Terrain visualization pipeline
│   │   └── terrain/
│   │       ├── TerrainGeometryObjectManager.ts  # Create geometry from tiles
│   │       └── TerrainObjectManager.ts          # Create/remove Three.js meshes
│   └── styles.css                # Global styles
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # ESLint configuration
├── .prettierrc.json              # Prettier configuration
└── package.json                  # Dependencies and scripts
```

## Testing

Run tests with Vitest:

```bash
bun run test              # Run all tests
bun run test:ui           # Interactive test UI
bun run test:coverage     # Coverage reports
bun run test src/drone/Drone.test.ts  # Single file
```

Tests are colocated with `.test.ts` suffix and use happy-dom for DOM simulation.

## Tech Stack

- **SolidJS** 1.9 - Reactive UI library
- **Three.js** 0.160 - 3D graphics rendering
- **TypeScript** 5.9 - Type safety
- **Vite** 7.3 - Build tool and dev server
- **Vitest** 4.0 - Unit testing framework
- **ESLint** 10 - Code linting
- **Prettier** 3.8 - Code formatting
- **Bun** - JavaScript runtime and package manager

## License

MIT
