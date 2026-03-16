import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DroneObject } from './DroneObject';
import { Drone } from '../../drone/Drone';
import { Group, Mesh } from 'three';

describe('DroneObject', () => {
  let droneObject: DroneObject;
  let drone: Drone;
  let mockViewer3D: {
    getScene: () => { add: ReturnType<typeof vi.fn> };
    render: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    drone = new Drone({ x: 0, y: 0 });
    mockViewer3D = { getScene: () => ({ add: vi.fn() }), render: vi.fn() };
    droneObject = new DroneObject(drone, mockViewer3D as any);
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

  describe('position and rotation via events', () => {
    it('should set position via locationChanged event', () => {
      const initialPosition = droneObject.getMesh().position.clone();

      drone.changeElevation(100);
      drone.startMovingForward();
      drone.applyMove(0.1); // Move forward
      drone.stopMovingForward();

      const obj = droneObject.getMesh();
      expect(obj.position.y).toBe(100); // Elevation changed
      expect(obj.position).not.toEqual(initialPosition);
    });

    it('should set rotation with azimuth 0 (North)', () => {
      // Trigger an event to ensure rotation order is set
      drone.rotateAzimuth(0);
      const obj = droneObject.getMesh();

      expect(obj.rotation.order).toBe('YXZ');
      expect(obj.rotation.y).toBeCloseTo(0, 5);
      expect(obj.rotation.x).toBeCloseTo(0, 5);
      expect(obj.rotation.z).toBeCloseTo(0, 5);
    });

    it('should set rotation for azimuth 90 (East)', () => {
      drone.rotateAzimuth(90);
      const obj = droneObject.getMesh();

      expect(obj.rotation.y).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should set rotation for azimuth 180 (South)', () => {
      drone.rotateAzimuth(180);
      const obj = droneObject.getMesh();

      expect(obj.rotation.y).toBeCloseTo(-Math.PI, 5);
    });

    it('should set rotation for azimuth 270 (West)', () => {
      drone.rotateAzimuth(270);
      const obj = droneObject.getMesh();

      expect(obj.rotation.y).toBeCloseTo((-270 * Math.PI) / 180, 5);
    });

    it('should update position on multiple elevation changes', () => {
      const initialY = droneObject.getMesh().position.y;

      drone.changeElevation(50); // Add 50 to initial elevation (0)
      expect(droneObject.getMesh().position.y).toBe(50);

      drone.changeElevation(50); // Add 50 more to get 100
      expect(droneObject.getMesh().position.y).toBe(100);

      expect(droneObject.getMesh().position.y).not.toBe(initialY);
    });

    it('should have correct rotation at all cardinal azimuth values', () => {
      const cases = [
        { azimuth: 0, expected: 0 },
        { azimuth: 90, expected: -Math.PI / 2 },
        { azimuth: 180, expected: -Math.PI },
        { azimuth: 270, expected: (-270 * Math.PI) / 180 },
      ];

      cases.forEach(({ azimuth, expected }) => {
        // Reset to 0 and rotate to target azimuth
        const currentAzimuth = drone.getAzimuth();
        const delta = azimuth - currentAzimuth;
        drone.rotateAzimuth(delta);

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

  describe('event subscription', () => {
    it('should respond to locationChanged events', () => {
      const initialPosition = droneObject.getMesh().position.clone();

      // Simulate drone movement
      drone.startMovingForward();
      drone.applyMove(0.1);
      drone.stopMovingForward();

      // Position should have changed
      expect(droneObject.getMesh().position).not.toEqual(initialPosition);
    });

    it('should respond to azimuthChanged events', () => {
      const initialRotation = droneObject.getMesh().rotation.y;

      drone.rotateAzimuth(45);

      // Rotation should have changed
      expect(droneObject.getMesh().rotation.y).not.toBeCloseTo(
        initialRotation,
        5
      );
    });

    it('should respond to elevationChanged events', () => {
      const initialPosition = droneObject.getMesh().position.clone();

      drone.changeElevation(50);

      // Position Y should have changed
      expect(droneObject.getMesh().position.y).not.toBe(initialPosition.y);
    });

    it('should call render on locationChanged', () => {
      drone.startMovingForward();
      drone.applyMove(0.1);
      expect(mockViewer3D.render).toHaveBeenCalled();
    });

    it('should call render on azimuthChanged', () => {
      drone.rotateAzimuth(45);
      expect(mockViewer3D.render).toHaveBeenCalled();
    });

    it('should call render on elevationChanged', () => {
      drone.changeElevation(50);
      expect(mockViewer3D.render).toHaveBeenCalled();
    });

    it('should not call render after dispose', () => {
      droneObject.dispose();
      mockViewer3D.render.mockClear();

      drone.rotateAzimuth(45);
      drone.changeElevation(50);
      drone.startMovingForward();
      drone.applyMove(0.1);

      expect(mockViewer3D.render).not.toHaveBeenCalled();
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposed', () => {
      expect(() => droneObject.dispose()).not.toThrow();
    });

    it('should unsubscribe from locationChanged event', () => {
      const offSpy = vi.spyOn(drone, 'off');
      droneObject.dispose();

      expect(offSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );
    });

    it('should unsubscribe from azimuthChanged event', () => {
      const offSpy = vi.spyOn(drone, 'off');
      droneObject.dispose();

      expect(offSpy).toHaveBeenCalledWith(
        'azimuthChanged',
        expect.any(Function)
      );
    });

    it('should unsubscribe from elevationChanged event', () => {
      const offSpy = vi.spyOn(drone, 'off');
      droneObject.dispose();

      expect(offSpy).toHaveBeenCalledWith(
        'elevationChanged',
        expect.any(Function)
      );
    });

    it('should stop responding to location changes after disposal', () => {
      const initialPosition = droneObject.getMesh().position.clone();

      droneObject.dispose();

      // Try to move drone
      drone.startMovingForward();
      drone.applyMove(0.1);
      drone.stopMovingForward();

      // Position should not have changed
      expect(droneObject.getMesh().position).toEqual(initialPosition);
    });

    it('should stop responding to azimuth changes after disposal', () => {
      const initialRotation = droneObject.getMesh().rotation.y;

      droneObject.dispose();

      // Try to change drone azimuth
      drone.rotateAzimuth(45);

      // Rotation should not have changed
      expect(droneObject.getMesh().rotation.y).toBeCloseTo(initialRotation, 5);
    });

    it('should stop responding to elevation changes after disposal', () => {
      const initialPosition = droneObject.getMesh().position.clone();

      droneObject.dispose();

      // Try to change drone elevation
      drone.changeElevation(50);

      // Position Y should not have changed
      expect(droneObject.getMesh().position.y).toBe(initialPosition.y);
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

/** Collect positions of rotor discs (CircleGeometry children positioned above Y=0) */
function collectRotorPositions(obj: Group | Mesh): { x: number; z: number }[] {
  const positions: { x: number; z: number }[] = [];
  (obj as Group).traverse((child) => {
    if (child instanceof Mesh && child.geometry?.type === 'CircleGeometry') {
      positions.push({ x: child.position.x, z: child.position.z });
    }
  });
  return positions;
}
