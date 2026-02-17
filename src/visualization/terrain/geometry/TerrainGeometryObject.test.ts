import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainGeometryObject } from './TerrainGeometryObject';

describe('TerrainGeometryObject', () => {
  let geometry: BufferGeometry;
  const tileKey = '9:261:168';
  const mercatorBounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };

  beforeEach(() => {
    geometry = new BufferGeometry();

    // Mock dispose method
    geometry.dispose = vi.fn();
  });

  describe('constructor', () => {
    it('should store the tile key, geometry, and mercator bounds', () => {
      const terrainGeometry = new TerrainGeometryObject(
        tileKey,
        geometry,
        mercatorBounds
      );

      expect(terrainGeometry.getTileKey()).toBe(tileKey);
      expect(terrainGeometry.getGeometry()).toBe(geometry);
      expect(terrainGeometry.getMercatorBounds()).toBe(mercatorBounds);
    });
  });

  describe('getTileKey', () => {
    it('should return the tile key in z:x:y format', () => {
      const terrainGeometry = new TerrainGeometryObject(
        tileKey,
        geometry,
        mercatorBounds
      );
      expect(terrainGeometry.getTileKey()).toBe('9:261:168');
    });
  });

  describe('getGeometry', () => {
    it('should return the BufferGeometry instance', () => {
      const terrainGeometry = new TerrainGeometryObject(
        tileKey,
        geometry,
        mercatorBounds
      );
      expect(terrainGeometry.getGeometry()).toBe(geometry);
    });
  });

  describe('getMercatorBounds', () => {
    it('should return the Mercator bounds', () => {
      const terrainGeometry = new TerrainGeometryObject(
        tileKey,
        geometry,
        mercatorBounds
      );
      expect(terrainGeometry.getMercatorBounds()).toBe(mercatorBounds);
    });
  });

  describe('dispose', () => {
    it('should dispose of geometry', () => {
      const terrainGeometry = new TerrainGeometryObject(
        tileKey,
        geometry,
        mercatorBounds
      );
      terrainGeometry.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
    });
  });
});
