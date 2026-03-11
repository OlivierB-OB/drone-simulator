# Implementation Patterns in Drone Simulator

## Architectural Patterns

### Observer/Event Pattern (TypedEventEmitter)
**Problem**: Decouples components for loose event-based communication
**Files**: `src/core/TypedEventEmitter.ts`
**Usage**: Foundation for all event-driven communication

**Key Components**:
- Drone: emits `locationChanged`, `azimuthChanged`, `elevationChanged`, `movingChanged`
- ElevationDataManager: emits `tileAdded`, `tileRemoved`
- ContextDataManager: emits `tileAdded`, `tileRemoved`
- TerrainGeometryObjectManager: emits `tileAdded`, `tileRemoved`
- TerrainTextureObjectManager: emits `tileAdded` (non-null textures only), `tileRemoved`

### Factory Pattern
**Problem**: Encapsulates object creation, separates creation from usage
**Key Implementations**:
- **TerrainGeometryFactory**: Creates Three.js `BufferGeometry` from elevation tiles
- **RoofGeometryFactory**: Creates roof geometries (pyramidal, cone, gabled, hipped, skillion, dome, onion)
- **BuildingMeshFactory**: Creates 3D building meshes using ExtrudeGeometry
- **Other Factories**: VegetationMeshFactory, StructureMeshFactory, BarrierMeshFactory, BridgeMeshFactory

### Strategy Pattern (Roof Strategies)
**Problem**: Encapsulate different roof shape generation algorithms
**Files**: `src/visualization/mesh/building/strategies/`
**Interface**: `IRoofGeometryStrategy { create(params: RoofParams): BufferGeometry }`
**Key Detail**: Handles ring winding orientation (CCW vs CW) using shoelace formula for correct face normals

**Similar Patterns**:
- **Vegetation Strategies**: ForestStrategy, ScrubStrategy, OrchardStrategy, VineyardStrategy, TreeRowStrategy, SingleTreeStrategy
- **Structure Strategies**: CylinderStrategy, TaperedCylinderStrategy, BoxStrategy, CraneStrategy, WaterTowerStrategy

### Adapter/Wrapper Pattern (Three.js Integration)
**Problem**: Wrap Three.js components to provide abstraction and testability
**Files**: `src/3Dviewer/Camera.ts`, `src/3Dviewer/Renderer.ts`, `src/3Dviewer/Scene.ts`, `src/3Dviewer/Viewer3D.ts`
**Key Detail**: Accept `typeof Constructor` (not instance) for dependency injection in tests

### Manager/Coordinator Pattern
**Problem**: Orchestrate multiple components with event-driven communication
**Files**: TerrainObjectManager, MeshObjectManager, ElevationDataManager, ContextDataManager
**Pattern**: `TerrainObjectManager` extends `TileObjectManager` (inheritance), using `TerrainGeometryObjectManager` as primary source and `TerrainTextureObjectManager` as secondary rebuild trigger. Other managers subscribe to events from child components and coordinate their output.

---

## Type System Patterns

### Typed Event Maps
**Problem**: Provide type-safe event payload validation
**Pattern**: Define event types as mapped objects
```typescript
export type DroneEvents = {
  locationChanged: MercatorCoordinates;
  azimuthChanged: number;
  elevationChanged: number;
  movingChanged: boolean;
};
```

### Geometric Type Definitions
**Files**: `src/gis/types.ts`, `src/data/elevation/types.ts`, `src/data/contextual/types.ts`
**Key Types**:
- `MercatorCoordinates`: { x, y } - Web Mercator projection
- `TileCoordinates`: { z, x, y } - Web Mercator tile system
- `MercatorBounds`: { minX, maxX, minY, maxY } - Tile geographic bounds
- Domain types: BuildingVisual, Polygon, ContextDataTile

### Coordinate System Transformation
**File**: `src/gis/types.ts`
**Function**: `mercatorToThreeJs(location: MercatorCoordinates, elevation: number)`
**Critical**: Negates Y to Z for Three.js (Mercator Y north → Three.js -Z forward)

---

## Resource Management Patterns

### Lifecycle Pattern (Constructor + Dispose)
**Problem**: Ensure clean resource cleanup on component teardown
**Pattern**: Every component with resources has a `dispose()` method
**Cleanup Steps**:
1. Unsubscribe from all events: `drone.off(...)`
2. Abort pending operations: `abortController.abort()`
3. Clear collections: `tileCache.clear()`, `pendingLoads.clear()`
4. Remove all listeners: `removeAllListeners()`

### Subscription Management
**Pattern**: Store bound handler references and unsubscribe in dispose
```typescript
private onMovingChanged: (isMoving: boolean) => void;

constructor(private readonly drone: Drone) {
  this.onMovingChanged = (isMoving) => { /* ... */ };
  drone.on('movingChanged', this.onMovingChanged);
}

dispose(): void {
  this.drone.off('movingChanged', this.onMovingChanged);
}
```

### Abort Signal Pattern (Cancellation Tokens)
**Problem**: Cancel pending async operations on component disposal
**Files**: `ElevationDataManager.ts`, `ElevationDataTileLoader.ts`
**Usage**: Pass `AbortSignal` to fetch for request cancellation

### Render Callback Pattern (Scene Changes)
**Problem**: Trigger renders only when scene changes, not every frame
**File**: `Scene.ts`
**Pattern**: Constructor accepts callback; call on mutations

### RequestAnimationFrame Coalescing
**Problem**: Prevent multiple renders per frame
**File**: `Viewer3D.ts`
**Pattern**: Check `if (pendingFrameId !== null) return;` before scheduling new frame

### Persistence Cache (IndexedDB)
**Files**: `ElevationTilePersistenceCache.ts`, `ContextTilePersistenceCache.ts`
**Features**:
- Singleton pattern for database instance
- Graceful degradation if IndexedDB unavailable
- 24-hour TTL with automatic cleanup
- Silently fails (non-critical)

---

## Testing Patterns

### Constructor Injection for Testing
**Problem**: Allow mock Three.js components without actual DOM/WebGL
**Pattern**: Pass constructor **class** (not instance) through constructor parameter
**Example**:
```typescript
const mockThreeCameraConstructor = class MockCamera extends THREE.PerspectiveCamera { ... };
const camera = new Camera(width, height, drone, mockThreeCameraConstructor);
```

### Mock Spy Pattern with vi.fn()
**Framework**: Vitest
**Usage**: Track calls and verify behavior
```typescript
const handler = vi.fn();
emitter.on('change', handler);
emitter.emit('change', { value: 42 });
expect(handler).toHaveBeenCalledWith({ value: 42 });
```

### Event Tracking in Tests
**Pattern**: Collect emitted events in arrays to verify ordering
```typescript
const events: EventData[] = [];
component.on('event', (data) => events.push(data));
// ... trigger events ...
expect(events).toHaveLength(expectedCount);
```

### Global RAF and Event Listener Stubs
**Files**: `AnimationLoop.test.ts`, `Viewer3D.test.ts`
**Pattern**: Stub `requestAnimationFrame` and `cancelAnimationFrame` globally for deterministic testing

### DOM Element Testing
**Pattern**: Create elements, set properties, add to document, clean up after
```typescript
const container = document.createElement('div');
Object.defineProperty(container, 'clientWidth', { value: 800 });
document.body.appendChild(container);
// ... test ...
document.body.removeChild(container);
```

### Mathematical Formula Testing
**Pattern**: Test with known values (Paris, Mount Everest, Dead Sea)
**Example**: Terrarium formula `(R × 256 + G + B/256) - 32768`

---

## Code Organization Patterns

### Directory Structure by Feature
```
src/
├── 3Dviewer/          # Three.js wrappers (Camera, Scene, Renderer, Viewer3D)
├── core/              # Core utilities (TypedEventEmitter, AnimationLoop)
├── drone/             # Drone physics and control
├── gis/               # Geographic coordinate system
├── data/
│   ├── elevation/     # Elevation tile data (AWS Terrain)
│   └── contextual/    # OSM context data (Overpass API)
├── visualization/
│   ├── terrain/       # Terrain geometry and texturing
│   ├── mesh/          # 3D mesh factories (buildings, vegetation, etc.)
│   └── drone/         # Drone 3D representation
└── config.ts          # Centralized configuration
```

### File Naming Conventions
- **Managers**: `*Manager.ts` - coordinate multiple components
- **Factories**: `*Factory.ts` - create objects
- **Strategies**: `*Strategy.ts` - implement algorithm variations
- **Tests**: `*.test.ts` - colocated with implementation
- **Types**: `types.ts` - domain-specific type definitions

### Configuration Management
**File**: `src/config.ts` - Single source of truth for:
- `droneConfig` - physics and controls
- `cameraConfig` - positioning
- `sceneConfig` - lighting and fog
- `elevationConfig` - tile management
- `contextDataConfig` - OSM data fetching
- Visual configuration: `colorPalette`, `buildingHeightDefaults`, etc.
- `debugConfig` - debug visualization

### Utility Functions vs Classes
- **Utility Functions**: Stateless, pure transformations (e.g., `mercatorToThreeJs()`)
- **Classes**: Stateful, resource-holding objects

---

## Asynchronous Patterns

### Promise-Based Async Loading with Concurrency Control
**Problem**: Load multiple tiles asynchronously while respecting server limits
**Files**: `ElevationDataManager.ts`, `ContextDataManager.ts`
**Pattern**:
- Track `loadingCount` against `maxConcurrentLoads`
- Queue pending tiles for loading
- Process queue when a load completes
- Use `Map<string, Promise>` to track pending loads

### Fetch with AbortSignal
**Pattern**: Pass AbortSignal to fetch for request cancellation
**Cleanup**: Call `abortController.abort()` on dispose

### PNG Decoding with Promise
**File**: `ElevationDataTileParser.ts`
**Pattern**: Use Image API in Promise to decode PNG asynchronously

---

## Three.js Integration Patterns

### Coordinate System Transformation (Critical)
**Problem**: Bridge Mercator geographic coordinates to Three.js world space
**Documented in**: `doc/coordinate-system.md`, verified by `src/gis/coordinateConsistency.test.ts`

**Transformation**:
```
Mercator X  →  Three.js X  (direct, East = +X)
Mercator Y  →  Three.js Z  (negated, North = -Z)
Elevation   →  Three.js Y  (direct, Up = +Y)
Azimuth     →  rotation.y  (negated, clockwise = -rad)
```

### Local Coordinate Space Pattern (Precision)
**Problem**: Avoid float32 precision loss at large Mercator coordinates
**Files**: `BuildingMeshFactory.ts`, `TerrainGeometryFactory.ts`
**Pattern**: Build geometry relative to centroid in local space, then position mesh at world position

### Mesh Disposal Pattern
**Pattern**: Traverse children and dispose geometry/material
```typescript
mesh.traverse((child) => {
  if (m.geometry) m.geometry.dispose();
  if (m.material) {
    Array.isArray(m.material) ? m.material.forEach(mat => mat.dispose()) : m.material.dispose();
  }
});
```

### Material Factories
**File**: `src/visualization/drone/factory/DronePartMaterialFactory.ts`
**Pattern**: Centralized material creation with consistent colors

### Texture Canvas Rendering
**File**: `TerrainCanvasRenderer.ts`
**Pattern**: Render terrain tiles onto canvas, convert to Three.js Texture

---

## Animation and Frame Management

### Delta Time Physics Pattern
**Files**: `AnimationLoop.ts`, `Drone.ts`
**Pattern**: Frame-rate independent physics using delta time in seconds
**Key**: Convert milliseconds to seconds for physics calculations

### Event-Driven Animation Loop Start/Stop
**Pattern**: AnimationLoop only runs when drone is moving
**Trigger**: Subscribe to `drone.movingChanged` event

---

## Pattern Summary Table

| Pattern | Problem | Files | Benefit |
|---------|---------|-------|---------|
| TypedEventEmitter | Loose coupling | `core/TypedEventEmitter.ts` | Type-safe pub/sub |
| Factory | Object creation | `*Factory.ts` files | Encapsulation |
| Strategy | Algorithm variations | `strategies/` | Extensibility |
| Observer | Component communication | Event subscribers | Decoupling |
| Adapter/Wrapper | Three.js abstraction | `3Dviewer/*` | Testability |
| Lifecycle (dispose) | Resource cleanup | All managers | No memory leaks |
| Constructor Injection | Testability | `Viewer3D`, `Camera`, `Scene` | Mock Three.js |
| AbortSignal | Cancellation | Tile loaders | Clean shutdown |
| Coordinate Transform | GPS→3D mapping | `mercatorToThreeJs()` | Correct rendering |
| Local Coordinate Space | Float32 precision | Building/terrain factories | Accuracy |
| Concurrency Control | Server limits | Data managers | Rate limiting |
| Persistence Cache | Offline support | Tile caches | Performance |
| Delta Time Physics | Frame-rate independence | `AnimationLoop`, `Drone` | Smooth motion |
