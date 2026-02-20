import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mesh, BufferGeometry } from 'three';
import { TerrainObjectManager } from './TerrainObjectManager';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import { TerrainTextureObjectManager } from './texture/TerrainTextureObjectManager';
import { TerrainObject } from './TerrainObject';
import { Scene } from '../../3Dviewer/Scene';
import type { ElevationDataTile } from '../../data/elevation/types';
import type { ElevationDataManager } from '../../data/elevation/ElevationDataManager';

describe('TerrainObjectManager', () => {
  let manager: TerrainObjectManager;
  let mockScene: Scene;
  let mockGeometryManager: TerrainGeometryObjectManager;
  let mockTextureManager: TerrainTextureObjectManager;
  let mockFactory: TerrainObjectFactory;
  let mockElevationData: Partial<ElevationDataManager>;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as Scene;

    mockElevationData = {
      on: vi.fn(),
      off: vi.fn(),
    };

    const mockGeometryFactory = {
      createGeometry: vi.fn(() => new BufferGeometry()),
    } as any;
    mockGeometryManager = new TerrainGeometryObjectManager(
      mockElevationData as ElevationDataManager,
      mockGeometryFactory
    );

    mockTextureManager = {
      createTexture: vi.fn(() => null),
      removeTexture: vi.fn(),
      getTerrainTextureObject: vi.fn(() => undefined),
      dispose: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    } as unknown as TerrainTextureObjectManager;

    mockFactory = new TerrainObjectFactory();

    manager = new TerrainObjectManager(
      mockScene,
      mockGeometryManager,
      mockTextureManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should create default factory if not provided', () => {
      const newManager = new TerrainObjectManager(
        mockScene,
        mockGeometryManager,
        mockTextureManager
      );
      expect(newManager).toBeDefined();
    });
  });

  describe('geometry addition', () => {
    it('should add terrain object to scene when geometry is added', () => {
      const tile = createMockElevationTile('9:261:168');
      const geometry = mockGeometryManager.createGeometry('9:261:168', tile);

      // Manually trigger the event that TerrainGeometryObjectManager would emit
      mockGeometryManager.emit('geometryAdded', { key: '9:261:168', geometry });

      expect(mockScene.add).toHaveBeenCalled();
      expect(manager.getTerrainObject('9:261:168')).toBeDefined();
    });

    it('should create geometry via geometry manager', () => {
      const tile = createMockElevationTile('9:261:168');
      const createSpy = vi.spyOn(mockGeometryManager, 'createGeometry');

      const geometry = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', { key: '9:261:168', geometry });

      expect(createSpy).toHaveBeenCalledWith('9:261:168', tile);
    });

    it('should create texture via texture manager when provided', () => {
      const elevTile = createMockElevationTile('9:261:168');

      const geometry = mockGeometryManager.createGeometry(
        '9:261:168',
        elevTile
      );
      mockGeometryManager.emit('geometryAdded', { key: '9:261:168', geometry });

      expect(mockTextureManager.createTexture).not.toHaveBeenCalled();
    });

    it('should pass mesh to scene.add()', () => {
      const tile = createMockElevationTile('9:261:168');

      const geometry = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', { key: '9:261:168', geometry });

      const addCalls = (mockScene.add as any).mock.calls;
      expect(addCalls.length).toBeGreaterThan(0);
      expect(addCalls[0][0]).toBeInstanceOf(Mesh);
    });

    it('should handle multiple tiles', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');

      const geom1 = mockGeometryManager.createGeometry('9:261:168', tile1);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom1,
      });

      const geom2 = mockGeometryManager.createGeometry('9:262:168', tile2);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:262:168',
        geometry: geom2,
      });

      expect(manager.getTerrainObject('9:261:168')).toBeDefined();
      expect(manager.getTerrainObject('9:262:168')).toBeDefined();
      expect(mockScene.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('geometry removal', () => {
    it('should remove terrain object from scene', () => {
      const tile = createMockElevationTile('9:261:168');
      const geom = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom,
      });
      vi.clearAllMocks();

      mockGeometryManager.removeGeometry('9:261:168');
      mockGeometryManager.emit('geometryRemoved', { key: '9:261:168' });

      expect(mockScene.remove).toHaveBeenCalled();
      expect(manager.getTerrainObject('9:261:168')).toBeUndefined();
    });

    it('should dispose terrain object', () => {
      const tile = createMockElevationTile('9:261:168');
      const geom = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom,
      });
      const terrainObject = manager.getTerrainObject('9:261:168')!;
      const disposeSpy = vi.spyOn(terrainObject, 'dispose');

      mockGeometryManager.removeGeometry('9:261:168');
      mockGeometryManager.emit('geometryRemoved', { key: '9:261:168' });

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should handle removing non-existent tile gracefully', () => {
      expect(() =>
        mockGeometryManager.removeGeometry('9:999:999')
      ).not.toThrow();
    });

    it('should only remove the specified tile', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      const geom1 = mockGeometryManager.createGeometry('9:261:168', tile1);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom1,
      });

      const geom2 = mockGeometryManager.createGeometry('9:262:168', tile2);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:262:168',
        geometry: geom2,
      });

      mockGeometryManager.removeGeometry('9:261:168');
      mockGeometryManager.emit('geometryRemoved', { key: '9:261:168' });

      expect(manager.getTerrainObject('9:261:168')).toBeUndefined();
      expect(manager.getTerrainObject('9:262:168')).toBeDefined();
    });
  });

  describe('texture addition', () => {
    it('should skip texture upgrade if terrain object does not exist', () => {
      const mockTextureObj = {
        getTexture: () => ({}),
        getTileKey: () => '9:261:168',
        getMercatorBounds: () => ({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 }),
        dispose: vi.fn(),
      } as any;

      expect(() =>
        mockTextureManager.emit('textureAdded', {
          key: '9:261:168',
          texture: mockTextureObj,
        })
      ).not.toThrow();
      expect(mockScene.add).not.toHaveBeenCalled();
    });

    it('should no-op if terrain object does not exist', () => {
      const mockTextureObj = {
        getTexture: () => ({}),
        getTileKey: () => '9:261:168',
        getMercatorBounds: () => ({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 }),
        dispose: vi.fn(),
      } as any;

      expect(() =>
        mockTextureManager.emit('textureAdded', {
          key: '9:261:168',
          texture: mockTextureObj,
        })
      ).not.toThrow();
      expect(mockScene.add).not.toHaveBeenCalled();
    });
  });

  describe('getTerrainObject', () => {
    it('should return the terrain object for a tile key', () => {
      const tile = createMockElevationTile('9:261:168');
      const geom = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom,
      });

      const terrainObject = manager.getTerrainObject('9:261:168');

      expect(terrainObject).toBeDefined();
      expect(terrainObject).toBeInstanceOf(TerrainObject);
      expect(terrainObject?.getTileKey()).toBe('9:261:168');
    });

    it('should return undefined for non-existent tile key', () => {
      expect(manager.getTerrainObject('9:999:999')).toBeUndefined();
    });
  });

  describe('dispose', () => {
    it('should dispose all terrain objects', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      const geom1 = mockGeometryManager.createGeometry('9:261:168', tile1);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom1,
      });

      const geom2 = mockGeometryManager.createGeometry('9:262:168', tile2);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:262:168',
        geometry: geom2,
      });

      const obj1 = manager.getTerrainObject('9:261:168')!;
      const obj2 = manager.getTerrainObject('9:262:168')!;
      const spy1 = vi.spyOn(obj1, 'dispose');
      const spy2 = vi.spyOn(obj2, 'dispose');

      manager.dispose();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should remove all objects from scene', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      const geom1 = mockGeometryManager.createGeometry('9:261:168', tile1);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom1,
      });

      const geom2 = mockGeometryManager.createGeometry('9:262:168', tile2);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:262:168',
        geometry: geom2,
      });

      vi.clearAllMocks();

      manager.dispose();

      expect(mockScene.remove).toHaveBeenCalledTimes(2);
    });

    it('should clear the objects map', () => {
      const tile = createMockElevationTile('9:261:168');
      const geom = mockGeometryManager.createGeometry('9:261:168', tile);
      mockGeometryManager.emit('geometryAdded', {
        key: '9:261:168',
        geometry: geom,
      });
      expect(manager.getTerrainObject('9:261:168')).toBeDefined();

      manager.dispose();
      expect(manager.getTerrainObject('9:261:168')).toBeUndefined();
    });

    it('should dispose geometry manager', () => {
      const disposeSpy = vi.spyOn(mockGeometryManager, 'dispose');

      manager.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose texture manager', () => {
      const disposeSpy = vi.spyOn(mockTextureManager, 'dispose');

      manager.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});

function createMockElevationTile(tileKey: string): ElevationDataTile {
  const parts = tileKey.split(':').map(Number);
  const z = parts[0]!;
  const x = parts[1]!;
  const y = parts[2]!;
  return {
    coordinates: { z, x, y },
    data: Array(256)
      .fill(null)
      .map(() => Array(256).fill(100)),
    tileSize: 256,
    zoomLevel: z,
    mercatorBounds: {
      minX: 0,
      maxX: 1000,
      minY: 0,
      maxY: 1000,
    },
  };
}
