import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Camera } from './Camera';
import * as THREE from 'three';

describe('Camera', () => {
  let camera: Camera;

  beforeEach(() => {
    camera = new Camera(1920, 1080);
  });

  describe('constructor', () => {
    it('should create a PerspectiveCamera with correct parameters', () => {
      const cameraInstance = camera.getCamera();

      expect(cameraInstance).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(cameraInstance.fov).toBe(75);
      expect(cameraInstance.near).toBe(0.1);
      expect(cameraInstance.far).toBe(1000);
    });

    it('should set correct aspect ratio based on dimensions', () => {
      const cameraInstance = camera.getCamera();
      const expectedAspect = 1920 / 1080;

      expect(cameraInstance.aspect).toBeCloseTo(expectedAspect, 5);
    });

    it('should accept optional injected camera constructor', () => {
      // Create a wrapper class that delegates to a tracked constructor
      const constructorCalls: any[] = [];
      const mockConstructor = class MockCamera extends THREE.PerspectiveCamera {
        constructor(fov: number, aspect: number, near: number, far: number) {
          super(fov, aspect, near, far);
          constructorCalls.push({ fov, aspect, near, far });
        }
      } as unknown as typeof THREE.PerspectiveCamera;

      const cameraInstance = new Camera(
        1920,
        1080,
        mockConstructor
      ).getCamera();

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({
        fov: 75,
        aspect: 1920 / 1080,
        near: 0.1,
        far: 1000,
      });
      expect(cameraInstance).toBeInstanceOf(THREE.PerspectiveCamera);
    });

    it('should initialize camera with correct parameters through constructor', () => {
      const constructorCalls: any[] = [];
      const mockConstructor = class MockCamera extends THREE.PerspectiveCamera {
        constructor(fov: number, aspect: number, near: number, far: number) {
          super(fov, aspect, near, far);
          constructorCalls.push({ fov, aspect, near, far });
        }
      } as unknown as typeof THREE.PerspectiveCamera;

      new Camera(1920, 1080, mockConstructor);

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({
        fov: 75,
        aspect: 1920 / 1080,
        near: 0.1,
        far: 1000,
      });
    });
  });

  describe('getCamera()', () => {
    it('should return the internal camera instance', () => {
      const camera1 = camera.getCamera();
      const camera2 = camera.getCamera();

      expect(camera1).toBe(camera2); // Should be same reference
    });

    it('should return a PerspectiveCamera', () => {
      const cameraInstance = camera.getCamera();
      expect(cameraInstance).toBeInstanceOf(THREE.PerspectiveCamera);
    });
  });

  describe('updateAspectRatio()', () => {
    it('should update aspect ratio based on new dimensions', () => {
      const cameraInstance = camera.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        cameraInstance,
        'updateProjectionMatrix'
      );

      camera.updateAspectRatio(1280, 720);

      const expectedAspect = 1280 / 720;
      expect(cameraInstance.aspect).toBeCloseTo(expectedAspect, 5);
      expect(updateProjectionMatrixSpy).toHaveBeenCalledOnce();
    });

    it('should handle square dimensions', () => {
      const cameraInstance = camera.getCamera();
      camera.updateAspectRatio(800, 800);

      expect(cameraInstance.aspect).toBe(1);
    });

    it('should handle wide aspect ratios', () => {
      const cameraInstance = camera.getCamera();
      camera.updateAspectRatio(3840, 1080);

      expect(cameraInstance.aspect).toBeCloseTo(3.556, 3);
    });

    it('should handle portrait dimensions', () => {
      const cameraInstance = camera.getCamera();
      camera.updateAspectRatio(1080, 1920);

      expect(cameraInstance.aspect).toBeCloseTo(0.5625, 5);
    });

    it('should update projection matrix after changing aspect ratio', () => {
      const cameraInstance = camera.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        cameraInstance,
        'updateProjectionMatrix'
      );

      camera.updateAspectRatio(2560, 1440);

      expect(updateProjectionMatrixSpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple resize calls', () => {
      const cameraInstance = camera.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        cameraInstance,
        'updateProjectionMatrix'
      );

      camera.updateAspectRatio(1280, 720);
      camera.updateAspectRatio(1920, 1080);
      camera.updateAspectRatio(800, 600);

      expect(updateProjectionMatrixSpy).toHaveBeenCalledTimes(3);
      expect(cameraInstance.aspect).toBeCloseTo(800 / 600, 5);
    });
  });

  describe('setPosition()', () => {
    it('should update camera position to given coordinates', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(10, 20, 30);

      expect(cameraInstance.position.x).toBe(10);
      expect(cameraInstance.position.y).toBe(20);
      expect(cameraInstance.position.z).toBe(30);
    });

    it('should handle negative coordinates', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(-100, -50, -25);

      expect(cameraInstance.position.x).toBe(-100);
      expect(cameraInstance.position.y).toBe(-50);
      expect(cameraInstance.position.z).toBe(-25);
    });

    it('should handle zero coordinates', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(0, 0, 0);

      expect(cameraInstance.position.x).toBe(0);
      expect(cameraInstance.position.y).toBe(0);
      expect(cameraInstance.position.z).toBe(0);
    });

    it('should allow multiple position updates', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(10, 20, 30);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(10, 20, 30));

      camera.setPosition(100, 200, 300);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(100, 200, 300));

      camera.setPosition(-5, -10, -15);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(-5, -10, -15));
    });

    it('should handle fractional coordinates', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(1.5, 2.75, 3.333);

      expect(cameraInstance.position.x).toBeCloseTo(1.5, 5);
      expect(cameraInstance.position.y).toBeCloseTo(2.75, 5);
      expect(cameraInstance.position.z).toBeCloseTo(3.333, 5);
    });
  });

  describe('setOrientation()', () => {
    it('should set camera rotation for 0° azimuth (North)', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(0);

      // Azimuth 0° = yaw 0, pitch -30°
      expect(cameraInstance.rotation.y).toBeCloseTo(0, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.z).toBe(0);
    });

    it('should set camera rotation for 90° azimuth (East)', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(90);

      // Azimuth 90° = yaw 90° (π/2 radians), pitch -30°
      expect(cameraInstance.rotation.y).toBeCloseTo((90 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.z).toBe(0);
    });

    it('should set camera rotation for 180° azimuth (South)', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(180);

      // Azimuth 180° = yaw 180° (π radians), pitch -30°
      expect(cameraInstance.rotation.y).toBeCloseTo((180 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.z).toBe(0);
    });

    it('should set camera rotation for 270° azimuth (West)', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(270);

      // Azimuth 270° = yaw 270° (3π/2 radians), pitch -30°
      expect(cameraInstance.rotation.y).toBeCloseTo((270 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.z).toBe(0);
    });

    it('should always maintain 30° downward inclination', () => {
      const cameraInstance = camera.getCamera();
      const expectedPitch = (-30 * Math.PI) / 180;

      // Test multiple azimuths
      for (const azimuth of [0, 45, 90, 135, 180, 225, 270, 315, 359]) {
        camera.setOrientation(azimuth);
        expect(cameraInstance.rotation.x).toBeCloseTo(expectedPitch, 5);
        expect(cameraInstance.rotation.z).toBe(0);
      }
    });

    it('should handle azimuth at 360° (equivalent to 0°)', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(360);

      // 360° in radians is 2π, which is mathematically equivalent to 0°
      // Check that both pitch and roll are correct
      expect(cameraInstance.rotation.x).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.z).toBe(0);
      // For yaw, 360° = 2π radians
      expect(cameraInstance.rotation.y).toBeCloseTo((360 * Math.PI) / 180, 5);
    });

    it('should set rotation order to YXZ', () => {
      const cameraInstance = camera.getCamera();

      camera.setOrientation(45);

      expect(cameraInstance.rotation.order).toBe('YXZ');
    });

    it('should allow multiple orientation updates', () => {
      const cameraInstance = camera.getCamera();
      const expectedPitch = (-30 * Math.PI) / 180;

      camera.setOrientation(0);
      expect(cameraInstance.rotation.y).toBeCloseTo(0, 5);

      camera.setOrientation(180);
      expect(cameraInstance.rotation.y).toBeCloseTo(Math.PI, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo(expectedPitch, 5);

      camera.setOrientation(90);
      expect(cameraInstance.rotation.y).toBeCloseTo(Math.PI / 2, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo(expectedPitch, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small dimensions', () => {
      const cameraInstance = camera.getCamera();
      expect(() => camera.updateAspectRatio(1, 1)).not.toThrow();
      expect(cameraInstance.aspect).toBe(1);
    });

    it('should handle very large dimensions', () => {
      const cameraInstance = camera.getCamera();
      expect(() => camera.updateAspectRatio(7680, 4320)).not.toThrow();
      expect(cameraInstance.aspect).toBeCloseTo(7680 / 4320, 5);
    });

    it('should handle setPosition with very large values', () => {
      const cameraInstance = camera.getCamera();

      camera.setPosition(10000, 10000, 10000);

      expect(cameraInstance.position.x).toBe(10000);
      expect(cameraInstance.position.y).toBe(10000);
      expect(cameraInstance.position.z).toBe(10000);
    });

    it('should handle setOrientation with large azimuth values', () => {
      const cameraInstance = camera.getCamera();
      const expectedPitch = (-30 * Math.PI) / 180;

      camera.setOrientation(720); // 2 full rotations

      expect(cameraInstance.rotation.y).toBeCloseTo((720 * Math.PI) / 180, 5);
      expect(cameraInstance.rotation.x).toBeCloseTo(expectedPitch, 5);
    });
  });
});
