# Drone Simulator

An interactive real-time 3D web application that lets you pilot a virtual drone over real-world terrain. Combines actual satellite elevation data with smooth flight physics, intuitive keyboard controls, and immersive 3D visualization.

**Live demo:** http://localhost:3000 (after running `bun run dev`)

---

## ✨ Features

| Feature                            | Description                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Real-World Terrain**             | Fly over actual geographic locations with accurate elevation data from AWS Terrarium satellite imagery |
| **Interactive Flight Control**     | Pilot with arrow keys: forward/backward, strafe left/right, rotate heading                             |
| **Dynamic Chase Camera**           | Follow the drone from behind with a camera that adjusts heading as you fly                             |
| **Seamless Tile Loading**          | Terrain loads and unloads in a ring around the drone—no interruption to flight                         |
| **Frame-Rate Independent Physics** | Consistent behavior regardless of device performance                                                   |
| **Rich Contextual Data**           | OSM (OpenStreetMap) integration: buildings, roads, water, vegetation, railways, and more               |
| **High-Precision Elevation**       | Sub-meter accuracy using Terrarium PNG encoding (R×256 + G + B/256)                                    |

---

## 🚀 Quick Start

### Prerequisites

- **Bun** (runtime & package manager) — [install](https://bun.sh)
- **Node.js 18+** (or use Bun as your Node alternative)

### Setup & Run

```bash
# Install dependencies
bun install

# Start dev server (http://localhost:3000)
bun run dev

# Production preview
bun run preview

# Production build (output: dist/)
bun run build
```

### Controls

| Input            | Action                             |
| ---------------- | ---------------------------------- |
| `↑` / `↓`        | Move forward / backward            |
| `←` / `→`        | Strafe left / right                |
| `W` / `S`        | Rotate heading (turn left / right) |
| **Mouse/Camera** | Follows drone automatically        |

---

## 🏗️ Architecture

### Core Systems

```
User Input (Keyboard)
  ↓
DroneController → Drone (Physics/Mercator Coords)
  ↓
AnimationLoop (requestAnimationFrame)
  ├→ Drone Position Update
  ├→ ElevationDataManager (tile loading)
  ├→ ContextDataManager (OSM features)
  └→ Terrain & Mesh Managers
     ├→ TerrainObjectManager (geometry + texture)
     └→ MeshObjectManager (buildings, structures)
  ↓
Viewer3D (Scene + Camera + Renderer)
  ↓
Render to Screen
```

### Key Components

- **`src/App.tsx`** — Orchestrates all systems (initialization, cleanup, lifecycle)
- **`src/drone/`** — Flight physics (position, heading, velocity in Mercator coordinates)
- **`src/core/AnimationLoop.ts`** — Frame synchronization at 60+ FPS with delta time
- **`src/3Dviewer/`** — Three.js wrapper (Scene, Camera, Renderer) with dependency injection
- **`src/data/elevation/`** — Real-world terrain fetching, caching, tile management
- **`src/data/contextual/`** — OSM feature loading (buildings, roads, water, vegetation)
- **`src/visualization/terrain/`** — Converts elevation + context data into 3D meshes and textures
- **`src/gis/`** — Coordinate system utilities (Mercator ↔ Three.js conversion)

See [`docs/architecture.md`](docs/architecture.md) for the complete component diagram.

---

## 📊 Project Structure

```
drone-simulator/
├── src/
│   ├── App.tsx                    # Root component
│   ├── config.ts                  # Centralized configuration
│   ├── 3Dviewer/                  # Three.js wrapper classes
│   ├── core/                      # Animation loop, event emitter
│   ├── drone/                     # Flight physics & controller
│   ├── gis/                       # Coordinate system (Mercator ↔ Three.js)
│   ├── data/
│   │   ├── elevation/             # Terrain height fetching & decoding
│   │   └── contextual/            # OSM feature loading
│   └── visualization/
│       ├── terrain/               # Terrain geometry & canvas textures
│       ├── mesh/                  # 3D objects (buildings, structures)
│       └── drone/                 # Drone visual representation
├── docs/                           # Comprehensive documentation (76 files)
│   ├── architecture.md            # Component diagram & data flow
│   ├── coordinate-system.md       # CRITICAL: Mercator ↔ Three.js conversion
│   ├── data/                      # Elevation & contextual data docs
│   ├── visualization/             # Canvas rendering, mesh creation
│   └── osm/                       # OpenStreetMap reference (50+ files)
├── index.html                     # Vite entry point
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Test configuration
└── package.json                   # Dependencies & scripts
```

---

## 🧪 Testing

```bash
# Run all tests (Vitest + happy-dom)
bun run test

# Interactive UI
bun run test:ui

# Coverage report
bun run test:coverage

# Single test file
bun run test src/drone/Drone.test.ts
```

**Coverage:** ~69% statement coverage, 32 test files, 90+ tests

See [`docs/README.md#testing`](docs/README.md) for testing patterns.

---

## 🛠️ Development Commands

### Quality & Formatting

```bash
# Type checking (no emit)
bun run type-check

# Linting (ESLint + TypeScript)
bun run lint

# Auto-fix ESLint issues
bun run lint:fix

# Format code (Prettier)
bun run format

# Check formatting without modifying
bun run format:check
```

---

## 📚 Documentation

The `docs/` directory contains 76 comprehensive files organized by topic:

### Getting Started

- **[overview.md](docs/overview.md)** — What the simulator does and use cases
- **[architecture.md](docs/architecture.md)** — Components, interaction flow, data pipelines
- **[quick-reference.md](docs/README.md)** — Navigation guide to all documentation

### Core Concepts

- **[coordinate-system.md](docs/coordinate-system.md)** ⭐ **CRITICAL** — Mercator to Three.js conversion (Z-negation, azimuth mapping)
- **[tile-ring-system.md](docs/tile-ring-system.md)** — Spatial tile loading/eviction strategy
- **[data-pipeline.md](docs/data-pipeline.md)** — Four-stage pipeline used across systems

### Data Systems

- **[data/elevations.md](docs/data/elevations.md)** — Terrain height, AWS Terrarium, precision
- **[data/contextual.md](docs/data/contextual.md)** — OSM features, loading strategy
- **[data/elevation-sampler.md](docs/data/elevation-sampler.md)** — Bilinear interpolation

### Visualization

- **[visualization/canvas-rendering.md](docs/visualization/canvas-rendering.md)** — OSM feature rasterization (9-layer painter's algorithm)
- **[visualization/ground-surface.md](docs/visualization/ground-surface.md)** — Terrain mesh generation
- **[visualization/objects.md](docs/visualization/objects.md)** — Buildings, structures, drone

### Reference

- **[osm/README.md](docs/osm/README.md)** — OpenStreetMap integration overview
- **[osm/buildings.md](docs/osm/buildings.md)**, **[highways.md](docs/osm/highways.md)**, **[water.md](docs/osm/water.md)**, etc. — Feature-specific docs
- **[patterns.md](docs/patterns.md)** — Observer, Factory, Dependency Injection
- **[glossary.md](docs/glossary.md)** — Technical term definitions

---

## 🛠️ Tech Stack

| Layer                  | Technologies           |
| ---------------------- | ---------------------- |
| **Frontend Framework** | SolidJS 1.9            |
| **Language**           | TypeScript 5.9         |
| **3D Graphics**        | Three.js 0.160         |
| **Build Tool**         | Vite 7.3               |
| **Test Runner**        | Vitest 4.0 + happy-dom |
| **Package Manager**    | Bun                    |
| **Code Quality**       | ESLint + Prettier      |

---

## 🌍 Real-World Examples

### Paris

- **Coordinates:** 48.8566°N, 2.3522°E (Mercator)
- **Terrain:** Île de France plateau, Seine river valley
- Configure in `src/config.ts`: `dronePosition: { x: 0.5, y: 0.5 }`

### Mount Everest

- **Elevation:** 8,848 m (encoded as RGB(162,144,0) in Terrarium)
- **Precision:** ±0.1 m (using Blue channel)
- Navigate to high mountains for extreme elevation testing

### Dead Sea

- **Elevation:** −430 m (negative elevation)
- **Precision test:** Validates sub-zero elevation handling

---

## 🏗️ Key Design Patterns

### Coordinate System Consistency

All components use the same geographic → 3D conversion:

```
threeX = mercator.x         // Direct
threeY = elevation          // Direct
threeZ = -mercator.y        // Negated (Y northward → -Z northward)
```

See [`docs/coordinate-system.md`](docs/coordinate-system.md) for the complete strategy.

### Observer Pattern

Event-driven updates through `TypedEventEmitter`:

```typescript
drone.onMove.subscribe(({ position, heading }) => {
  /* update */
});
elevationData.onTileAdded.subscribe(({ tile }) => {
  /* create mesh */
});
```

### Factory Pattern

Consistent object creation with dependency injection:

```typescript
const drone = createDrone(droneConfig);
const viewer = new Viewer3D(Scene, Camera, Renderer); // Constructor classes
```

### Resource Cleanup

All components implement `dispose()` for proper cleanup (listeners, timers, resources).

---

## ✅ Quality Assurance

**Test Coverage:** ~69% statement coverage

- Coordinate system validation (21 tests)
- Async resource management (30 tests)
- Elevation data accuracy (26 tests)
- Drone physics & movement (18+ tests)
- Animation loop timing (12+ tests)

**Linting & Type Safety:**

```bash
# Check all rules + TypeScript types
bun run lint

# Auto-fix formatting issues
bun run lint:fix
```

---

## 📋 Design Philosophy

The project follows these principles (see [`CLAUDE.md`](CLAUDE.md)):

- **Simplicity First** — KISS principle, prefer simple solutions
- **Separation of Concerns** — Physics, data, and visualization are independent
- **SOLID Principles** — Single responsibility, dependency injection
- **DRY** — Eliminate duplication through abstraction
- **Resource Cleanup** — All components properly dispose of resources

---

## 🤝 Contributing

1. **Read the guidelines** — See [`CLAUDE.md`](CLAUDE.md) for working together rules
2. **Run tests** — Ensure all tests pass: `bun run test`
3. **Check quality** — Run linting and formatting: `bun run lint && bun run format`
4. **Document changes** — Update relevant docs in `docs/`
5. **Follow patterns** — Use existing patterns (Observer, Factory, DI) for consistency

---

## 📝 License

MIT — See [`LICENSE`](LICENSE) for details

**Author:** Olivier BERNARD

---

## 🔗 See Also

- **Architecture Deep Dive** — [`docs/architecture.md`](docs/architecture.md)
- **Coordinate System** — [`docs/coordinate-system.md`](docs/coordinate-system.md)
- **All Documentation** — [`docs/README.md`](docs/README.md)
- **Development Philosophy** — [`CLAUDE.md`](CLAUDE.md)

---

**Happy flying! 🚁**
