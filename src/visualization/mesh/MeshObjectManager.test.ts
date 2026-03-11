import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContextDataTile } from '../../data/contextual/types';
import type { Scene } from '../../3Dviewer/Scene';
import type { ElevationSampler } from './util/ElevationSampler';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { Object3D } from 'three';

// Shared arrays that factory create-methods return — mutated per-test in beforeEach
const buildingMeshes: Object3D[] = [];
const bridgeRoadMeshes: Object3D[] = [];

// Vitest 4 requires function (not arrow) declarations for constructable mocks
vi.mock('./building/BuildingMeshFactory', () => ({
  BuildingMeshFactory: vi.fn(function (this: { create: () => Object3D[] }) {
    this.create = vi.fn(() => [...buildingMeshes]);
  }),
}));
vi.mock('./vegetation/VegetationMeshFactory', () => ({
  VegetationMeshFactory: vi.fn(function (this: { create: () => Object3D[] }) {
    this.create = vi.fn(() => []);
  }),
}));
vi.mock('./structure/StructureMeshFactory', () => ({
  StructureMeshFactory: vi.fn(function (this: { create: () => Object3D[] }) {
    this.create = vi.fn(() => []);
  }),
}));
vi.mock('./barrier/BarrierMeshFactory', () => ({
  BarrierMeshFactory: vi.fn(function (this: { create: () => Object3D[] }) {
    this.create = vi.fn(() => []);
  }),
}));
vi.mock('./bridge/BridgeMeshFactory', () => ({
  BridgeMeshFactory: vi.fn(function (this: {
    createFromRoads: () => Object3D[];
    createFromRailways: () => Object3D[];
  }) {
    this.createFromRoads = vi.fn(() => [...bridgeRoadMeshes]);
    this.createFromRailways = vi.fn(() => []);
  }),
}));

// Import AFTER vi.mock so the mocked version is used
const { MeshObjectManager } = await import('./MeshObjectManager');

function makeDataSource() {
  let addedHandler:
    | ((data: { key: string; tile: ContextDataTile }) => void)
    | undefined;
  let removedHandler: ((data: { key: string }) => void) | undefined;
  return {
    on: vi.fn((event: string, handler: unknown) => {
      if (event === 'tileAdded') addedHandler = handler as typeof addedHandler;
      if (event === 'tileRemoved')
        removedHandler = handler as typeof removedHandler;
    }),
    off: vi.fn(),
    fireAdded: (key: string, tile: ContextDataTile) =>
      addedHandler!({ key, tile }),
    fireRemoved: (key: string) => removedHandler!({ key }),
  };
}

function makeScene(): Scene {
  return { add: vi.fn(), remove: vi.fn() } as unknown as Scene;
}

function makeTile(key: string): ContextDataTile {
  const [z, x, y] = key.split(':').map(Number);
  return {
    coordinates: { z: z!, x: x!, y: y! },
    mercatorBounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    zoomLevel: z!,
    features: {
      buildings: [],
      roads: [],
      railways: [],
      waters: [],
      airports: [],
      vegetation: [],
      landuse: [],
      structures: [],
      barriers: [],
    },
    colorPalette: {} as ContextDataTile['colorPalette'],
  };
}

type MockMesh = Object3D & {
  geometry: { dispose: ReturnType<typeof vi.fn> };
  material: { dispose: ReturnType<typeof vi.fn> };
};

function makeMockMesh(): MockMesh {
  const geometry = { dispose: vi.fn() };
  const material = { dispose: vi.fn() };
  return {
    traverse: vi.fn((cb: (obj: unknown) => void) => cb({ geometry, material })),
    geometry,
    material,
  } as unknown as MockMesh;
}

describe('MeshObjectManager', () => {
  let dataSource: ReturnType<typeof makeDataSource>;
  let scene: Scene;

  beforeEach(() => {
    buildingMeshes.length = 0;
    bridgeRoadMeshes.length = 0;
    vi.clearAllMocks();
    dataSource = makeDataSource();
    scene = makeScene();
  });

  function buildManager(): InstanceType<typeof MeshObjectManager> {
    return new MeshObjectManager(
      scene,
      dataSource as unknown as ContextDataManager,
      {} as ElevationSampler
    );
  }

  describe('constructor', () => {
    it('subscribes to tileAdded and tileRemoved on contextData', () => {
      buildManager();
      expect(dataSource.on).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
      expect(dataSource.on).toHaveBeenCalledWith(
        'tileRemoved',
        expect.any(Function)
      );
    });
  });

  describe('tileAdded', () => {
    it('does not throw when tile is added', () => {
      buildManager();
      expect(() =>
        dataSource.fireAdded('9:261:168', makeTile('9:261:168'))
      ).not.toThrow();
    });

    it('adds factory-produced meshes to scene', () => {
      const mesh = makeMockMesh();
      buildingMeshes.push(mesh);

      buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));

      expect(scene.add).toHaveBeenCalledWith(mesh);
    });
  });

  describe('tileRemoved', () => {
    it('does not throw for unknown keys', () => {
      buildManager();
      expect(() => dataSource.fireRemoved('9:999:999')).not.toThrow();
    });

    it('removes mesh from scene and disposes geometry and material', () => {
      const mesh = makeMockMesh();
      buildingMeshes.push(mesh);

      buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');

      expect(scene.remove).toHaveBeenCalledWith(mesh);
      expect(mesh.geometry.dispose).toHaveBeenCalled();
      expect(mesh.material.dispose).toHaveBeenCalled();
    });

    it('does not re-remove mesh after second tileRemoved for same key', () => {
      const mesh = makeMockMesh();
      buildingMeshes.push(mesh);

      buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');
      dataSource.fireRemoved('9:261:168'); // key no longer in map

      expect(scene.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', () => {
    it('unsubscribes from tileAdded and tileRemoved', () => {
      const manager = buildManager();
      manager.dispose();
      expect(dataSource.off).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
      expect(dataSource.off).toHaveBeenCalledWith(
        'tileRemoved',
        expect.any(Function)
      );
    });

    it('removes all remaining stored meshes from scene', () => {
      const mesh = makeMockMesh();
      buildingMeshes.push(mesh);

      const manager = buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      manager.dispose();

      expect(scene.remove).toHaveBeenCalledWith(mesh);
    });

    it('does not throw when disposing empty manager', () => {
      const manager = buildManager();
      expect(() => manager.dispose()).not.toThrow();
    });
  });
});
