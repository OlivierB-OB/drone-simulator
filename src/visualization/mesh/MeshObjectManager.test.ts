import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContextDataTile } from '../../data/contextual/types';
import type { Scene } from '../../3Dviewer/Scene';
import type { ElevationSampler } from './util/ElevationSampler';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { Object3D } from 'three';
import { OriginManager } from '../../gis/OriginManager';

// Mock the registry module
const mockCreateAllMeshes = vi.fn((): Object3D[] => []);
vi.mock('../../features/registry', () => ({
  featureRegistry: {
    createAllMeshes: () => mockCreateAllMeshes(),
  },
}));
vi.mock('../../features/registration', () => ({}));

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

function makeElevationDataSource() {
  let addedHandler:
    | ((data: { key: string; tile: unknown }) => void)
    | undefined;
  return {
    on: vi.fn((event: string, handler: unknown) => {
      if (event === 'tileAdded') addedHandler = handler as typeof addedHandler;
    }),
    off: vi.fn(),
    fireAdded: (key: string) => addedHandler!({ key, tile: null }),
  };
}

function makeScene(): Scene {
  return { add: vi.fn(), remove: vi.fn() } as unknown as Scene;
}

function makeTile(key: string): ContextDataTile {
  const [z, x, y] = key.split(':').map(Number);
  return {
    coordinates: { z: z!, x: x!, y: y! },
    geoBounds: { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 },
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
    vi.clearAllMocks();
    mockCreateAllMeshes.mockReturnValue([]);
    dataSource = makeDataSource();
    scene = makeScene();
  });

  function buildManager(
    elevationSource = makeElevationDataSource()
  ): InstanceType<typeof MeshObjectManager> {
    const originManager = new OriginManager({ lat: 48.853, lng: 2.3499 });
    return new MeshObjectManager(
      scene,
      dataSource as unknown as ContextDataManager,
      {} as ElevationSampler,
      elevationSource as unknown as import('../../data/elevation/ElevationDataManager').ElevationDataManager,
      originManager
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
      mockCreateAllMeshes.mockReturnValue([mesh]);

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
      mockCreateAllMeshes.mockReturnValue([mesh]);

      buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');

      expect(scene.remove).toHaveBeenCalledWith(mesh);
      expect(mesh.geometry.dispose).toHaveBeenCalled();
      expect(mesh.material.dispose).toHaveBeenCalled();
    });

    it('does not re-remove mesh after second tileRemoved for same key', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      buildManager();
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');
      dataSource.fireRemoved('9:261:168'); // key no longer in map

      expect(scene.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('elevation tileAdded (rebuild)', () => {
    it('no-ops when elevation key has no matching context tile', () => {
      const elevationSource = makeElevationDataSource();
      buildManager(elevationSource);
      expect(() => elevationSource.fireAdded('9:261:168')).not.toThrow();
      expect(scene.add).not.toHaveBeenCalled();
    });

    it('rebuilds meshes when elevation key matches a loaded context tile', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      const elevationSource = makeElevationDataSource();
      buildManager(elevationSource);

      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      expect(scene.add).toHaveBeenCalledTimes(1);

      // Reset for rebuild detection
      vi.clearAllMocks();
      const newMesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([newMesh]);

      elevationSource.fireAdded('9:261:168');

      // Old mesh removed before new mesh added
      expect(scene.remove).toHaveBeenCalled();
      expect(scene.add).toHaveBeenCalled();
    });

    it('disposes old mesh geometry and material on rebuild', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      const elevationSource = makeElevationDataSource();
      buildManager(elevationSource);

      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      elevationSource.fireAdded('9:261:168');

      expect(mesh.geometry.dispose).toHaveBeenCalled();
      expect(mesh.material.dispose).toHaveBeenCalled();
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
      mockCreateAllMeshes.mockReturnValue([mesh]);

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
