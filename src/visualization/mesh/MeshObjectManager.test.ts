import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import type { ContextDataTile } from '../../data/contextual/types';
import type { Scene } from '../../3Dviewer/Scene';
import type { ElevationSampler } from './util/ElevationSampler';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import { OriginManager } from '../../gis/OriginManager';

// Mock the registry module
const mockCreateAllMeshes = vi.fn((): THREE.Object3D[] => []);
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

function makeElevationDataSource(elevationReady = false) {
  let addedHandler:
    | ((data: { key: string; tile: unknown }) => void)
    | undefined;
  const getTileAt = vi.fn().mockReturnValue(elevationReady ? {} : null);
  return {
    on: vi.fn((event: string, handler: unknown) => {
      if (event === 'tileAdded') addedHandler = handler as typeof addedHandler;
    }),
    off: vi.fn(),
    getTileAt,
    fireAdded: (key: string) => addedHandler!({ key, tile: null }),
    setReady: (ready: boolean) => getTileAt.mockReturnValue(ready ? {} : null),
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

function makeMockMesh(): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  vi.spyOn(geometry, 'dispose');
  const material = new THREE.MeshBasicMaterial();
  vi.spyOn(material, 'dispose');
  return new THREE.Mesh(geometry, material);
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

    it('subscribes to tileAdded on elevationData', () => {
      const elevationSource = makeElevationDataSource();
      buildManager(elevationSource);
      expect(elevationSource.on).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
    });
  });

  describe('tileAdded (gating)', () => {
    it('does not add to scene when elevation is not ready', () => {
      buildManager(makeElevationDataSource(false));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      expect(scene.add).not.toHaveBeenCalled();
    });

    it('adds a Group to scene immediately when elevation is already ready', () => {
      buildManager(makeElevationDataSource(true));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.Group));
    });

    it('does not throw when tile is added', () => {
      buildManager();
      expect(() =>
        dataSource.fireAdded('9:261:168', makeTile('9:261:168'))
      ).not.toThrow();
    });

    it('includes factory-produced meshes inside the group when elevation is ready', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      buildManager(makeElevationDataSource(true));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));

      const group = (scene.add as ReturnType<typeof vi.fn>).mock
        .calls[0]![0] as THREE.Group;
      expect(group.children).toContain(mesh);
    });
  });

  describe('elevation tileAdded', () => {
    it('no-ops when no pending context exists', () => {
      const elevationSource = makeElevationDataSource();
      buildManager(elevationSource);
      expect(() => elevationSource.fireAdded('9:261:168')).not.toThrow();
      expect(scene.add).not.toHaveBeenCalled();
    });

    it('builds pending tile when elevation becomes ready', () => {
      const elevationSource = makeElevationDataSource(false);
      buildManager(elevationSource);

      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      expect(scene.add).not.toHaveBeenCalled();

      elevationSource.setReady(true);
      elevationSource.fireAdded('9:261:168');

      expect(scene.add).toHaveBeenCalledWith(expect.any(THREE.Group));
    });

    it('builds pending tile only once — no rebuild on subsequent elevation events', () => {
      const elevationSource = makeElevationDataSource(false);
      buildManager(elevationSource);

      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      elevationSource.setReady(true);
      elevationSource.fireAdded('9:261:168');
      elevationSource.fireAdded('9:261:168'); // second elevation event

      expect(scene.add).toHaveBeenCalledTimes(1);
    });

    it('never calls scene.remove during tile build (no rebuild cycle)', () => {
      const elevationSource = makeElevationDataSource(false);
      buildManager(elevationSource);

      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      elevationSource.setReady(true);
      elevationSource.fireAdded('9:261:168');

      expect(scene.remove).not.toHaveBeenCalled();
    });
  });

  describe('tileRemoved', () => {
    it('does not throw for unknown keys', () => {
      buildManager();
      expect(() => dataSource.fireRemoved('9:999:999')).not.toThrow();
    });

    it('does not call scene.remove for a tile that was pending (never built)', () => {
      buildManager(makeElevationDataSource(false));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');
      expect(scene.remove).not.toHaveBeenCalled();
    });

    it('removes the group from scene and disposes geometry and material', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      buildManager(makeElevationDataSource(true));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));

      const group = (scene.add as ReturnType<typeof vi.fn>).mock
        .calls[0]![0] as THREE.Group;

      dataSource.fireRemoved('9:261:168');

      expect(scene.remove).toHaveBeenCalledWith(group);
      expect(
        mesh.geometry.dispose as ReturnType<typeof vi.fn>
      ).toHaveBeenCalled();
      expect(
        (mesh.material as THREE.Material).dispose as ReturnType<typeof vi.fn>
      ).toHaveBeenCalled();
    });

    it('does not re-remove group after second tileRemoved for same key', () => {
      const mesh = makeMockMesh();
      mockCreateAllMeshes.mockReturnValue([mesh]);

      buildManager(makeElevationDataSource(true));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      dataSource.fireRemoved('9:261:168');
      dataSource.fireRemoved('9:261:168');

      expect(scene.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', () => {
    it('unsubscribes from tileAdded and tileRemoved on contextData', () => {
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

    it('unsubscribes from tileAdded on elevationData', () => {
      const elevationSource = makeElevationDataSource();
      const manager = buildManager(elevationSource);
      manager.dispose();
      expect(elevationSource.off).toHaveBeenCalledWith(
        'tileAdded',
        expect.any(Function)
      );
    });

    it('removes all remaining built groups from scene', () => {
      const manager = buildManager(makeElevationDataSource(true));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      manager.dispose();
      expect(scene.remove).toHaveBeenCalledWith(expect.any(THREE.Group));
    });

    it('does not throw when disposing with pending (unbuilt) tiles', () => {
      const manager = buildManager(makeElevationDataSource(false));
      dataSource.fireAdded('9:261:168', makeTile('9:261:168'));
      expect(() => manager.dispose()).not.toThrow();
    });

    it('does not throw when disposing empty manager', () => {
      const manager = buildManager();
      expect(() => manager.dispose()).not.toThrow();
    });
  });
});
