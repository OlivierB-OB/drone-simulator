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

## Development Commands

### Setup
```bash
bun install
```

### Development Server
```bash
bun run dev          # Start dev server at http://localhost:3000
bun run preview      # Preview production build locally
```

### Build & Testing
```bash
bun run build        # Create optimized production build (output in dist/)
```

### Code Quality
```bash
bun run lint         # Check for linting issues
bun run lint:fix     # Auto-fix linting issues
bun run format       # Format code with Prettier
bun run format:check # Check formatting without modifying files
```

## Architecture Overview

### Tech Stack
- **SolidJS** 1.9 - Reactive UI library (not React despite README)
- **TypeScript** 5.9 - Type safety
- **Three.js** 0.160 - 3D graphics rendering
- **Vite** 7.3 - Build tool and dev server
- **Bun** - JavaScript runtime and package manager

### Core Architecture Layers

#### 1. **Application Entry Point** (`src/App.tsx`)
SolidJS component that orchestrates the three main systems:
- `Viewer3D`: Renders 3D scene using Three.js
- `InputController`: Handles keyboard and mouse events
- `Drone`: Models drone state and physics

All three are instantiated in `onMount()` and properly disposed in cleanup.

#### 2. **3D Rendering System** (`src/3Dviewer/`)
Facade pattern wrapping Three.js components for cleaner API:
- `Viewer3D.ts`: Main orchestrator that manages animation loop (requestAnimationFrame)
  - Calls `drone.applyMove(deltaTime)` each frame to update drone physics
  - Calculates frame delta time in seconds for consistent physics
  - Uses container dimensions, not window dimensions
- `CameraFacade.ts`: Wraps Three.js camera with aspect ratio updates
- `SceneFacade.ts`: Wraps Three.js Scene
- `RendererFacade.ts`: Wraps WebGLRenderer with resize handling

Currently renders a simple rotating cube; will be replaced with drone visualization.

#### 3. **Drone Control System** (`src/drone/`)
- **Drone.ts**: Core state and physics
  - Tracks location in Mercator coordinates (from lat/lon conversion)
  - Tracks azimuth (heading in degrees, 0 = North)
  - Movement states: forward/backward/left/right (boolean flags)
  - `applyMove(deltaTime)` applies physics using realistic drone parameters from config
  - Movement respects drone's heading (e.g., forward moves in direction of azimuth)
  - Static helper: `latLonToMercator()` converts GPS coordinates to Mercator projection

- **InputController.ts**: Keyboard and mouse event handling
  - Arrow keys: drone movement (up/down/left/right)
  - Mouse movement: logs horizontal motion (placeholder for future rotation)
  - Mouse wheel: logs vertical motion (placeholder for future altitude)
  - Properly cleans up all event listeners in `dispose()`

#### 4. **Configuration** (`src/config.ts`)
Centralized drone parameters:
- `initialCoordinates`: Starting position (Paris Île de la Cité)
- `movementSpeed`: 12 m/s (realistic drone cruising speed)
- `rotationSpeed`: 60°/s (realistic drone rotation)

### Data Flow
1. User presses arrow keys → `InputController` → `Drone` state changes
2. Each animation frame, `Viewer3D` calls `drone.applyMove(deltaTime)`
3. `Drone` updates location based on movement flags and azimuth
4. `Viewer3D` renders updated scene (currently just rotating cube)

### Key Patterns
- **Facade pattern**: 3D viewer wraps Three.js for cleaner contracts
- **Physics delta-time**: Frame-rate independent movement using deltaTime
- **Mercator coordinates**: Uses realistic geographic projection for GPS-based positioning
- **Event cleanup**: All event listeners removed in dispose() methods to prevent memory leaks
