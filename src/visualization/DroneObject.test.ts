import { describe, it, expect, beforeEach } from 'vitest';
import { DroneObject } from './DroneObject';
import { ConeGeometry, MeshBasicMaterial, Mesh } from 'three';

describe('DroneObject', () => {
  let droneObject: DroneObject;

  beforeEach(() => {
    droneObject = new DroneObject();
  });

  describe('constructor', () => {
    it('should create a mesh', () => {
      expect(droneObject.getMesh()).toBeInstanceOf(Mesh);
    });

    it('should accept injected constructors', () => {
      const constructorCalls: string[] = [];
      class MockGeometry extends ConeGeometry {
        constructor(radius: number, height: number, segments: number) {
          super(radius, height, segments);
          constructorCalls.push('geometry');
        }
      }
      class MockMaterial extends MeshBasicMaterial {
        constructor(params: any) {
          super(params);
          constructorCalls.push('material');
        }
      }

      new DroneObject(
        MockGeometry as typeof ConeGeometry,
        MockMaterial as typeof MeshBasicMaterial
      );

      expect(constructorCalls).toContain('geometry');
      expect(constructorCalls).toContain('material');
    });
  });

  describe('update()', () => {
    it('should set position', () => {
      droneObject.update(100, 50, -200, 0);
      const mesh = droneObject.getMesh() as Mesh;

      expect(mesh.position.x).toBe(100);
      expect(mesh.position.y).toBe(50);
      expect(mesh.position.z).toBe(-200);
    });

    it('should set rotation for azimuth 0 (North)', () => {
      droneObject.update(0, 0, 0, 0);
      const mesh = droneObject.getMesh() as Mesh;

      expect(mesh.rotation.order).toBe('YXZ');
      expect(mesh.rotation.y).toBeCloseTo(0, 5);
      expect(mesh.rotation.x).toBeCloseTo(-Math.PI / 2, 5);
      expect(mesh.rotation.z).toBe(0);
    });

    it('should set rotation for azimuth 90 (East)', () => {
      droneObject.update(0, 0, 0, 90);
      const mesh = droneObject.getMesh() as Mesh;

      // Azimuth 90° clockwise = -90° in Three.js rotation.y
      expect(mesh.rotation.y).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should set rotation for azimuth 270 (West)', () => {
      droneObject.update(0, 0, 0, 270);
      const mesh = droneObject.getMesh() as Mesh;

      // Azimuth 270° clockwise = -270° = +90° in Three.js rotation.y
      expect(mesh.rotation.y).toBeCloseTo((-270 * Math.PI) / 180, 5);
    });

    it('should update position on multiple calls', () => {
      droneObject.update(10, 20, 30, 0);
      droneObject.update(100, 200, 300, 45);
      const mesh = droneObject.getMesh() as Mesh;

      expect(mesh.position.x).toBe(100);
      expect(mesh.position.y).toBe(200);
      expect(mesh.position.z).toBe(300);
    });
  });

  describe('getMesh()', () => {
    it('should return the same mesh reference', () => {
      const mesh1 = droneObject.getMesh();
      const mesh2 = droneObject.getMesh();
      expect(mesh1).toBe(mesh2);
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposed', () => {
      expect(() => droneObject.dispose()).not.toThrow();
    });
  });
});
