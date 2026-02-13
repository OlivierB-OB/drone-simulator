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

    it('should position camera at z=5', () => {
      const cameraInstance = camera.getCamera();

      expect(cameraInstance.position.z).toBe(5);
      expect(cameraInstance.position.x).toBe(0);
      expect(cameraInstance.position.y).toBe(0);
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
      expect(cameraInstance.position.z).toBe(5);
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
  });
});
