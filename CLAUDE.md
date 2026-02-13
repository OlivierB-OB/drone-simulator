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
bun run build           # Create optimized production build (output in dist/)
bun run test            # Run all tests with vitest
bun run test:ui         # Run tests with interactive UI
bun run test:coverage   # Generate coverage report (text, json, html)
```

To run a single test file:
```bash
bun run test src/drone/Drone.test.ts
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
- **Vitest** 4.0 - Unit testing framework with happy-dom environment
- **Bun** - JavaScript runtime and package manager

### Core Architecture Layers

#### 1. **Application Entry Point** (`src/App.tsx`)

SolidJS component that orchestrates the four main systems:

- `Viewer3D`: Renders 3D scene using Three.js
- `AnimationLoop`: Manages the requestAnimationFrame loop and frame timing
- `DroneController`: Handles keyboard and mouse events
- `Drone`: Models drone state and physics

All four are instantiated in `onMount()` and properly disposed in cleanup.

#### 2. **3D Rendering System** (`src/3Dviewer/`)

Wrapper pattern for Three.js components providing a cleaner API and testability:

- `Viewer3D.ts`: Main orchestrator that handles rendering
  - Updates 3D scene each frame when called by AnimationLoop
  - Manages Three.js scene setup and cleanup
  - Accepts optional injected wrapper components for dependency injection (used in testing)
- `Camera.ts`: Wraps Three.js PerspectiveCamera
  - Accepts optional `cameraConstructor` parameter for constructor injection
  - Initializes with fixed parameters: FOV=75, near=0.1, far=1000, position.z=5
  - Updates aspect ratio on resize
- `Scene.ts`: Wraps Three.js Scene
  - Accepts optional `sceneConstructor` parameter for constructor injection
  - Automatically sets dark navy background (0x1a1a2e)
- `Renderer.ts`: Wraps WebGLRenderer
  - Accepts optional `rendererConstructor` parameter for constructor injection
  - Always initializes with antialias enabled and device pixel ratio set

#### 2a. **Animation Loop** (`src/core/AnimationLoop.ts`)

Manages the requestAnimationFrame loop and frame timing:

- Calls `viewer3D.render(deltaTime)` each frame for rendering
- Calls `drone.applyMove(deltaTime)` each frame to update drone physics
- Calculates frame delta time in seconds for consistent physics (frame-rate independent movement)
- Handles cleanup of animation loop on dispose

#### 3. **Drone Control System** (`src/drone/`)

- **Drone.ts**: Core state and physics
  - Factory function: `createDrone()` initializes drone at configured position
  - Tracks location in Mercator coordinates (from lat/lon conversion)
  - Tracks azimuth (heading in degrees, 0 = North)
  - Movement states: forward/backward/left/right (boolean flags)
  - `applyMove(deltaTime)` applies physics using realistic drone parameters from config
  - Movement respects drone's heading (e.g., forward moves in direction of azimuth)
  - Static helper: `latLonToMercator()` converts GPS coordinates to Mercator projection

- **DroneController.ts**: Keyboard and mouse event handling
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

1. User presses arrow keys → `DroneController` → `Drone` state changes (movement flags)
2. Each animation frame, `AnimationLoop`:
   - Calls `drone.applyMove(deltaTime)` to update drone physics/location
   - Calls `viewer3D.render(deltaTime)` to render the updated scene
3. `Drone` updates location based on movement flags and azimuth
4. `Viewer3D` renders updated scene with drone visualization

### Key Patterns

- **Wrapper pattern with constructor injection**: 3D viewer components wrap Three.js classes. Constructor parameters accept constructor functions (not instances) for dependency injection. This enables:
  - Tests to inject mock constructors and verify initialization parameters
  - Decoupling from Three.js during testing
  - Always-consistent initialization logic (no conditional branches)
- **Animation loop separation**: `AnimationLoop` decouples frame timing from rendering and physics
- **Frame-rate independence**: Delta time in seconds ensures consistent physics regardless of FPS
- **Mercator projection**: Uses realistic geographic projection for GPS-based positioning
- **Factory pattern**: `createDrone()` factory function for drone initialization
- **Resource cleanup**: All components implement `dispose()` to clean up event listeners and Three.js resources

### Testing Strategy for Wrapper Components

The wrapper classes use constructor injection to enable better testability:

- Tests inject mock constructor **classes** (not instances) into wrapper components
- Mock constructors extend the real Three.js classes (e.g., `class MockCamera extends PerspectiveCamera`)
- Constructor calls are tracked to verify correct initialization parameters
- Example: `Camera` must call its injected constructor with `(75, width/height, 0.1, 1000)`

When testing, always use constructor classes rather than instances:
```typescript
// ✓ Correct: Pass constructor function
const mockConstructor = class MockCamera extends THREE.PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    super(fov, aspect, near, far);
    constructorCalls.push({ fov, aspect, near, far });
  }
} as unknown as typeof THREE.PerspectiveCamera;

camera = new Camera(width, height, mockConstructor);
```

## Testing

Tests are located alongside their source files with `.test.ts` suffix and use Vitest with happy-dom environment.

### Test Organization

- **Component tests** (`Camera.test.ts`, `Scene.test.ts`, `Renderer.test.ts`): Test Three.js wrapper initialization and functionality
  - Use constructor injection to verify component initialization parameters
  - Example: Verify `Camera` initializes with correct FOV, aspect ratio, near/far planes
- **Drone.test.ts**: Comprehensive unit tests for drone physics, movement, and coordinate conversion
  - Tests movement in all directions and combinations
  - Verifies frame-rate independent movement
  - Tests Mercator projection conversion
  - Coverage includes edge cases (equator, prime meridian, southern hemisphere)
- **DroneController.test.ts**: Tests input handling and event listener cleanup
- **AnimationLoop.test.ts**: Tests frame timing and delta time calculations
- **Viewer3D.test.ts**: Tests 3D scene orchestration with injected components

### Running Tests

```bash
bun run test              # Run all tests
bun run test:ui           # Interactive test UI
bun run test:coverage     # Generate coverage reports (text, json, html)
bun run test src/drone/Drone.test.ts  # Run single test file
```

The test environment uses happy-dom for lightweight DOM simulation without a full browser. Run `bun run test:coverage` to generate coverage reports in text, JSON, and HTML formats.
