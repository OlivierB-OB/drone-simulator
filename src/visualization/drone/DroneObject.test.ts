import { describe, it, expect, beforeEach } from 'vitest';
import { DroneObject } from './DroneObject';
import { Drone } from '../../drone/Drone';
import { Group, Mesh } from 'three';

describe('DroneObject', () => {
  let droneObject: DroneObject;
  let drone: Drone;

  beforeEach(() => {
    drone = new Drone({ x: 0, y: 0 });
    droneObject = new DroneObject(drone);
  });

  describe('constructor', () => {
    it('should create a Group as root object', () => {
      expect(droneObject.getMesh()).toBeInstanceOf(Group);
    });

    it('should contain child meshes for drone parts', () => {
      const group = droneObject.getMesh();
      const meshCount = countMeshes(group);
      // fuselage + front indicator + 4*(arm + motor + rotor) + 2*skid + 4*struts = 20
      expect(meshCount).toBeGreaterThanOrEqual(16);
    });
  });

  describe('update()', () => {
    it('should set position', () => {
      droneObject.update(100, 50, -200, 0, 0.016);
      const obj = droneObject.getMesh();

      expect(obj.position.x).toBe(100);
      expect(obj.position.y).toBe(50);
      expect(obj.position.z).toBe(-200);
    });

    it('should set rotation for azimuth 0 (North)', () => {
      droneObject.update(0, 0, 0, 0, 0.016);
      const obj = droneObject.getMesh();

      expect(obj.rotation.order).toBe('YXZ');
      expect(obj.rotation.y).toBeCloseTo(0, 5);
      expect(obj.rotation.x).toBeCloseTo(0, 5);
      expect(obj.rotation.z).toBe(0);
    });

    it('should set rotation for azimuth 90 (East)', () => {
      droneObject.update(0, 0, 0, 90, 0.016);
      const obj = droneObject.getMesh();

      expect(obj.rotation.y).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should set rotation for azimuth 270 (West)', () => {
      droneObject.update(0, 0, 0, 270, 0.016);
      const obj = droneObject.getMesh();

      expect(obj.rotation.y).toBeCloseTo((-270 * Math.PI) / 180, 5);
    });

    it('should update position on multiple calls', () => {
      droneObject.update(10, 20, 30, 0, 0.016);
      droneObject.update(100, 200, 300, 45, 0.016);
      const obj = droneObject.getMesh();

      expect(obj.position.x).toBe(100);
      expect(obj.position.y).toBe(200);
      expect(obj.position.z).toBe(300);
    });

    it('should animate rotors without throwing', () => {
      expect(() => droneObject.update(0, 0, 0, 0, 0.1)).not.toThrow();
    });

    it('should rotate rotors when deltaTime is positive', () => {
      const group = droneObject.getMesh() as Group;
      const rotors = collectRotorMeshes(group);
      const initialY = rotors.map((r) => r.rotation.y);

      droneObject.update(0, 0, 0, 0, 0.1);

      rotors.forEach((rotor, i) => {
        const initialYVal = initialY[i];
        expect(rotor.rotation.y).not.toBeCloseTo(initialYVal ?? 0, 1);
      });
    });

    it('should counter-rotate adjacent rotors', () => {
      const group = droneObject.getMesh() as Group;
      const rotors = collectRotorMeshes(group);
      const initialY = rotors.map((r) => r.rotation.y);

      droneObject.update(0, 0, 0, 0, 0.1);

      // Even-indexed and odd-indexed rotors spin in opposite directions
      const rotor0 = rotors[0];
      const rotor1 = rotors[1];
      if (rotor0 && rotor1) {
        const delta0 = rotor0.rotation.y - (initialY[0] ?? 0);
        const delta1 = rotor1.rotation.y - (initialY[1] ?? 0);
        expect(Math.sign(delta0)).not.toBe(Math.sign(delta1));
      }
    });

    it('should have correct rotation at all cardinal azimuth values', () => {
      const cases = [
        { azimuth: 0, expected: 0 },
        { azimuth: 90, expected: -Math.PI / 2 },
        { azimuth: 180, expected: -Math.PI },
        { azimuth: 270, expected: (-270 * Math.PI) / 180 },
      ];

      cases.forEach(({ azimuth, expected }) => {
        droneObject.update(0, 0, 0, azimuth, 0.016);
        const obj = droneObject.getMesh();
        expect(obj.rotation.y).toBeCloseTo(expected, 5);
        expect(obj.children.length).toBeGreaterThan(0);
      });
    });
  });

  describe('rotor positions', () => {
    it('should have rotors in all four diagonal quadrants', () => {
      const group = droneObject.getMesh() as Group;
      const rotorPositions = collectRotorPositions(group);

      expect(rotorPositions.length).toBe(4);

      // Each quadrant should have exactly one rotor
      const hasQuadrant = (signX: number, signZ: number) =>
        rotorPositions.some(
          (p) => Math.sign(p.x) === signX && Math.sign(p.z) === signZ
        );

      expect(hasQuadrant(+1, -1)).toBe(true); // Front-Right (+X, -Z)
      expect(hasQuadrant(-1, -1)).toBe(true); // Front-Left (-X, -Z)
      expect(hasQuadrant(+1, +1)).toBe(true); // Back-Right (+X, +Z)
      expect(hasQuadrant(-1, +1)).toBe(true); // Back-Left (-X, +Z)
    });

    it('should have rotors positioned away from center (not crossing)', () => {
      const group = droneObject.getMesh() as Group;
      const rotorPositions = collectRotorPositions(group);

      // All rotors should be well outside the fuselage (fuselage halfW=0.8, halfL=1.1)
      rotorPositions.forEach((p) => {
        const distFromCenter = Math.sqrt(p.x * p.x + p.z * p.z);
        expect(distFromCenter).toBeGreaterThan(2);
      });
    });
  });

  describe('getMesh()', () => {
    it('should return the same reference', () => {
      const ref1 = droneObject.getMesh();
      const ref2 = droneObject.getMesh();
      expect(ref1).toBe(ref2);
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposed', () => {
      expect(() => droneObject.dispose()).not.toThrow();
    });
  });
});

/** Count all Mesh instances in the scene graph */
function countMeshes(
  obj: { children: { children: unknown[] }[] } & object
): number {
  let count = 0;
  (obj as Group).traverse((child) => {
    if (child instanceof Mesh) count++;
  });
  return count;
}

/** Collect rotor disc meshes (CircleGeometry children) */
function collectRotorMeshes(obj: Group | Mesh): Mesh[] {
  const meshes: Mesh[] = [];
  (obj as Group).traverse((child) => {
    if (child instanceof Mesh && child.geometry?.type === 'CircleGeometry') {
      meshes.push(child);
    }
  });
  return meshes;
}

/** Collect positions of rotor discs (CircleGeometry children positioned above Y=0) */
function collectRotorPositions(
  obj: Group | Mesh
): Array<{ x: number; z: number }> {
  const positions: Array<{ x: number; z: number }> = [];
  (obj as Group).traverse((child) => {
    if (child instanceof Mesh && child.geometry?.type === 'CircleGeometry') {
      positions.push({ x: child.position.x, z: child.position.z });
    }
  });
  return positions;
}
