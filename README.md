# Drone Simulator

An interactive real-time 3D web application that lets you pilot a virtual drone over real-world terrain. Combines actual satellite elevation data with smooth flight physics, intuitive keyboard controls, and immersive 3D visualization.

**Live demo:** Available at [GitHub Pages](https://olivierb-ob.github.io/osm-drone-simulator/) (auto-deployed from main branch via GitHub Actions)

---

## ✨ Features

| Feature                            | Description                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Real-World Terrain**             | Fly over actual geographic locations with accurate elevation data from AWS Terrarium satellite imagery |
| **Interactive Flight Control**     | Pilot with arrow keys: forward/backward, strafe left/right, rotate heading with mouse                  |
| **Location Search & Discovery**    | Geocode any location via Nominatim, or explore 236 curated landmarks across 12 categories              |
| **Dynamic Chase Camera**           | Follow the drone from behind with a camera that adjusts heading as you fly                             |
| **Seamless Tile Loading**          | Terrain loads and unloads in a ring around the drone—no interruption to flight                         |
| **Frame-Rate Independent Physics** | Consistent behavior regardless of device performance                                                   |
| **Rich Contextual Features**       | 10 feature modules: buildings (7 roof types), vegetation (6 strategies), roads, water, railways, aeroways, structures, barriers, bridges, landuse |
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
| **Mouse Left/Right** | Rotate heading                  |
| **Mouse Wheel Up/Down** | Increase / decrease elevation |
| **Search Bar**   | Navigate to any location worldwide |
| **Discover** | View 5 random curated landmark places |

---

## 🏗️ Architecture

### Core Systems

```
User Input (Keyboard + Mouse)
  ↓
DroneController → Drone (Physics/Geographic Coords)
  ↓
AnimationLoop (requestAnimationFrame)
  ├→ Drone Position Update
  ├→ ElevationDataManager (tile loading)
  ├→ ContextDataManager (OSM/Overture features)
  └→ Terrain & Mesh Managers
     ├→ TerrainObjectManager (geometry + texture)
     └→ MeshObjectManager (buildings, structures)
  ↓
OriginManager (coordinate projection)
  ↓
Viewer3D (Scene + Camera + Renderer)
  ↓
UI (Header, LocationSearch, PlacesModal, Tooltips)
  ↓
Render to Screen
```

### Key Components

- **`src/App.tsx`** — Orchestrates all systems (initialization, cleanup, lifecycle)
- **`src/drone/`** — Flight physics (position, heading, velocity in geographic coordinates)
- **`src/drone/AnimationLoop.ts`** — Frame synchronization at 60+ FPS with delta time
- **`src/3Dviewer/`** — Three.js wrapper (Scene, Camera, Renderer) with dependency injection
- **`src/gis/OriginManager.ts`** — Holds drone position as Three.js origin; manages coordinate projection
- **`src/gis/GeoCoordinates.ts`** — Geographic ↔ Three.js projection via `geoToLocal()`
- **`src/data/elevation/`** — Real-world terrain fetching, caching, tile management (AWS Terrarium)
- **`src/data/contextual/`** — Overture Maps PMTiles features (buildings, roads, water, vegetation)
- **`src/data/places/`** — 236 curated landmark locations across 12 categories
- **`src/visualization/terrain/`** — Converts elevation + context data into 3D meshes and textures
- **`src/visualization/mesh/`** — 3D objects (buildings, vegetation, structures, barriers, bridges)
- **`src/features/`** — Feature registry and modular rendering system (10 modules)
- **`src/ui/`** — User interface (Header, LocationSearch, PlacesModal, AttributionBar, Tooltip)

See [`docs/architecture.md`](docs/architecture.md) for the complete component diagram.

---

## 📊 Project Structure

```
drone-simulator/
├── src/
│   ├── App.tsx                    # Root component
│   ├── config.ts                  # Centralized configuration
│   ├── 3Dviewer/                  # Three.js wrapper classes
│   ├── drone/                     # Flight physics & controller
│   ├── gis/                       # Coordinate system (geographic ↔ Three.js)
│   ├── data/
│   │   ├── elevation/             # Terrain height fetching & decoding
│   │   ├── contextual/            # Overture Maps feature loading
│   │   └── places/                # Curated landmark locations
│   ├── features/                  # Feature registry & modular rendering (10 modules)
│   ├── ui/                        # User interface components
│   │   ├── Header.tsx             # App header with links
│   │   ├── LocationSearch.tsx     # Geocoding search (Nominatim)
│   │   ├── PlacesModal.tsx        # Curated places discovery
│   │   ├── AttributionBar.tsx     # Data attribution
│   │   └── Tooltip.tsx            # Reusable tooltips
│   └── visualization/
│       ├── terrain/               # Terrain geometry & canvas textures
│       ├── mesh/                  # 3D objects (buildings, structures)
│       └── drone/                 # Drone visual representation
├── docs/                           # Comprehensive documentation (79 files)
│   ├── architecture.md            # Component diagram & data flow
│   ├── coordinate-system.md       # CRITICAL: Geographic (WGS84) → local tangent plane
│   ├── data/                      # Elevation & contextual data docs
│   ├── visualization/             # Canvas rendering, mesh creation
│   ├── osm/                       # OpenStreetMap reference
│   └── overture/                  # Overture Maps reference
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

**Test Framework:** Vitest with happy-dom and fake-indexeddb

**Key Patterns:**
- Constructor injection: Pass mock Three.js classes to enable testing
- Event tracking: Array-based listeners to verify event emissions
- Geographic math: Use `toBeCloseTo()` for floating-point comparisons
- IndexedDB: `fake-indexeddb` for persistence cache testing

**Note:** happy-dom logs network errors from tile fetchers to stderr — these are normal and don't indicate test failures.

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

The `docs/` directory contains 79 comprehensive files organized by topic:

### Getting Started

- **[overview.md](docs/overview.md)** — What the simulator does and use cases
- **[architecture.md](docs/architecture.md)** — Components, interaction flow, data pipelines
- **[quick-reference.md](docs/README.md)** — Navigation guide to all documentation

### Core Concepts

- **[coordinate-system.md](docs/coordinate-system.md)** ⭐ **CRITICAL** — Geographic (WGS84) to Three.js projection via `geoToLocal()` (local tangent plane)
- **[tile-ring-system.md](docs/tile-ring-system.md)** — Spatial tile loading/eviction strategy
- **[data-pipeline.md](docs/data-pipeline.md)** — Four-stage pipeline used across systems

### Data Systems

- **[data/elevations.md](docs/data/elevations.md)** — Terrain height, AWS Terrarium, precision
- **[data/contextual.md](docs/data/contextual.md)** — Overture Maps features, loading strategy
- **[data/elevation-sampler.md](docs/data/elevation-sampler.md)** — Bilinear interpolation

### Visualization

- **[visualization/canvas-rendering.md](docs/visualization/canvas-rendering.md)** — Feature rasterization (9-layer painter's algorithm)
- **[visualization/ground-surface.md](docs/visualization/ground-surface.md)** — Terrain mesh generation
- **[visualization/objects.md](docs/visualization/objects.md)** — Buildings, structures, drone

### Reference

- **[osm/README.md](docs/osm/README.md)** — OpenStreetMap integration overview
- **[overture/README.md](docs/overture/README.md)** — Overture Maps schema reference
- **[patterns.md](docs/patterns.md)** — Observer, Factory, Dependency Injection
- **[glossary.md](docs/glossary.md)** — Technical term definitions

---

## 🛠️ Tech Stack

| Layer                  | Technologies           |
| ---------------------- | ---------------------- |
| **Frontend Framework** | SolidJS                |
| **Language**           | TypeScript             |
| **3D Graphics**        | Three.js               |
| **Build Tool**         | Vite                   |
| **Test Runner**        | Vitest + happy-dom + fake-indexeddb |
| **Package Manager**    | Bun                    |
| **UI Library**         | Kobalte UI (accessible primitives) |
| **Geospatial**        | Turf.js (distance, bearing, area calculations) |
| **Code Quality**       | ESLint + Prettier      |

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

- [Architecture Deep Dive](docs/architecture.md)
- [Coordinate System](docs/coordinate-system.md)
- [All Documentation](docs/README.md)
- [Development Guidelines](CLAUDE.md)

---

**Happy flying! 🚁**
