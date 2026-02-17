import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { SurfaceMeshObject } from './SurfaceMeshObject';

describe('SurfaceMeshObject', () => {
  let geometry: BufferGeometry;
  const tileKey = '9:261:168';

  beforeEach(() => {
    geometry = new BufferGeometry();

    // Mock dispose method
    geometry.dispose = vi.fn();
  });

  describe('constructor', () => {
    it('should store the tile key and geometry', () => {
      const surfaceMesh = new SurfaceMeshObject(tileKey, geometry);

      expect(surfaceMesh.getTileKey()).toBe(tileKey);
      expect(surfaceMesh.getGeometry()).toBe(geometry);
    });
  });

  describe('getTileKey', () => {
    it('should return the tile key in z:x:y format', () => {
      const surfaceMesh = new SurfaceMeshObject(tileKey, geometry);
      expect(surfaceMesh.getTileKey()).toBe('9:261:168');
    });
  });

  describe('getGeometry', () => {
    it('should return the BufferGeometry instance', () => {
      const surfaceMesh = new SurfaceMeshObject(tileKey, geometry);
      expect(surfaceMesh.getGeometry()).toBe(geometry);
    });
  });

  describe('dispose', () => {
    it('should dispose of geometry', () => {
      const surfaceMesh = new SurfaceMeshObject(tileKey, geometry);
      surfaceMesh.dispose();

      expect(geometry.dispose).toHaveBeenCalled();
    });
  });
});
