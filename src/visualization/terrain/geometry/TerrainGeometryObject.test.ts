import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainGeometryObject } from './TerrainGeometryObject';

describe('TerrainGeometryObject', () => {
  let geometry: BufferGeometry;
  const tileKey = '9:261:168';

  beforeEach(() => {
    geometry = new BufferGeometry();

    // Mock dispose method
    geometry.dispose = vi.fn();
  });

  describe('constructor', () => {
    it('should store the tile key and geometry', () => {
      const terrainGeometry = new TerrainGeometryObject(tileKey, geometry);

      expect(terrainGeometry.getTileKey()).toBe(tileKey);
      expect(terrainGeometry.getGeometry()).toBe(geometry);
    });
  });

  describe('getTileKey', () => {
    it('should return the tile key in z:x:y format', () => {
      const terrainGeometry = new TerrainGeometryObject(tileKey, geometry);
      expect(terrainGeometry.getTileKey()).toBe('9:261:168');
    });
  });

  describe('getGeometry', () => {
    it('should return the BufferGeometry instance', () => {
      const terrainGeometry = new TerrainGeometryObject(tileKey, geometry);
      expect(terrainGeometry.getGeometry()).toBe(geometry);
    });
  });

  describe('dispose', () => {
    it('should dispose of geometry', () => {
      const terrainGeometry = new TerrainGeometryObject(tileKey, geometry);
      terrainGeometry.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
    });
  });
});
