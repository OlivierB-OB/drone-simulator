import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainMeshObject } from './TerrainMeshObject';

describe('TerrainMeshObject', () => {
  let geometry: BufferGeometry;
  const tileKey = '9:261:168';

  beforeEach(() => {
    geometry = new BufferGeometry();

    // Mock dispose method
    geometry.dispose = vi.fn();
  });

  describe('constructor', () => {
    it('should store the tile key and geometry', () => {
      const terrainMesh = new TerrainMeshObject(tileKey, geometry);

      expect(terrainMesh.getTileKey()).toBe(tileKey);
      expect(terrainMesh.getGeometry()).toBe(geometry);
    });
  });

  describe('getTileKey', () => {
    it('should return the tile key in z:x:y format', () => {
      const terrainMesh = new TerrainMeshObject(tileKey, geometry);
      expect(terrainMesh.getTileKey()).toBe('9:261:168');
    });
  });

  describe('getGeometry', () => {
    it('should return the BufferGeometry instance', () => {
      const terrainMesh = new TerrainMeshObject(tileKey, geometry);
      expect(terrainMesh.getGeometry()).toBe(geometry);
    });
  });

  describe('dispose', () => {
    it('should dispose of geometry', () => {
      const terrainMesh = new TerrainMeshObject(tileKey, geometry);
      terrainMesh.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
    });
  });
});
