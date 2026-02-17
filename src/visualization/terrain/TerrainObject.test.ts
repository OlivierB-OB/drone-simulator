import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mesh, BufferGeometry, MeshPhongMaterial } from 'three';
import { TerrainObject } from './TerrainObject';

describe('TerrainObject', () => {
  let mesh: Mesh;
  let geometry: BufferGeometry;
  let material: MeshPhongMaterial;
  const tileKey = '9:261:168';

  beforeEach(() => {
    geometry = new BufferGeometry();
    material = new MeshPhongMaterial();
    mesh = new Mesh(geometry, material);

    // Mock dispose methods
    geometry.dispose = vi.fn();
    material.dispose = vi.fn();
  });

  describe('constructor', () => {
    it('should store the tile key and mesh', () => {
      const terrainObject = new TerrainObject(tileKey, mesh);

      expect(terrainObject.getTileKey()).toBe(tileKey);
      expect(terrainObject.getMesh()).toBe(mesh);
    });
  });

  describe('getTileKey', () => {
    it('should return the tile key in z:x:y format', () => {
      const terrainObject = new TerrainObject(tileKey, mesh);
      expect(terrainObject.getTileKey()).toBe('9:261:168');
    });
  });

  describe('getMesh', () => {
    it('should return the Mesh instance', () => {
      const terrainObject = new TerrainObject(tileKey, mesh);
      expect(terrainObject.getMesh()).toBe(mesh);
    });
  });

  describe('dispose', () => {
    it('should dispose of geometry and material', () => {
      const terrainObject = new TerrainObject(tileKey, mesh);
      terrainObject.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
      expect(material.dispose).toHaveBeenCalled();
    });

    it('should handle array of materials', () => {
      const material1 = new MeshPhongMaterial();
      const material2 = new MeshPhongMaterial();
      material1.dispose = vi.fn();
      material2.dispose = vi.fn();
      const meshWithMaterials = new Mesh(geometry, [material1, material2]);

      const terrainObject = new TerrainObject(tileKey, meshWithMaterials);
      terrainObject.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
      expect(material1.dispose).toHaveBeenCalled();
      expect(material2.dispose).toHaveBeenCalled();
    });
  });
});
