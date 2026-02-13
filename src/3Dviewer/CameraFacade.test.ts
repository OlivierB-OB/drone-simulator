import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CameraFacade } from './CameraFacade';
import * as THREE from 'three';

describe('CameraFacade', () => {
  let facade: CameraFacade;

  beforeEach(() => {
    facade = new CameraFacade(1920, 1080);
  });

  describe('constructor', () => {
    it('should create a PerspectiveCamera with correct parameters', () => {
      const camera = facade.getCamera();

      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(camera.fov).toBe(75);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
    });

    it('should set correct aspect ratio based on dimensions', () => {
      const camera = facade.getCamera();
      const expectedAspect = 1920 / 1080;

      expect(camera.aspect).toBeCloseTo(expectedAspect, 5);
    });

    it('should position camera at z=5', () => {
      const camera = facade.getCamera();

      expect(camera.position.z).toBe(5);
      expect(camera.position.x).toBe(0);
      expect(camera.position.y).toBe(0);
    });

    it('should accept optional injected camera', () => {
      const mockCamera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
      mockCamera.position.z = 10;

      const injectedFacade = new CameraFacade(1920, 1080, mockCamera);
      const camera = injectedFacade.getCamera();

      expect(camera).toBe(mockCamera);
      expect(camera.fov).toBe(60);
      expect(camera.far).toBe(100);
      expect(camera.position.z).toBe(10);
    });

    it('should use injected camera without overwriting position', () => {
      const mockCamera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
      mockCamera.position.set(5, 10, 15);

      const injectedFacade = new CameraFacade(1920, 1080, mockCamera);
      const camera = injectedFacade.getCamera();

      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(10);
      expect(camera.position.z).toBe(15);
    });
  });

  describe('getCamera()', () => {
    it('should return the internal camera instance', () => {
      const camera1 = facade.getCamera();
      const camera2 = facade.getCamera();

      expect(camera1).toBe(camera2); // Should be same reference
    });

    it('should return a PerspectiveCamera', () => {
      const camera = facade.getCamera();
      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    });
  });

  describe('updateAspectRatio()', () => {
    it('should update aspect ratio based on new dimensions', () => {
      const camera = facade.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        camera,
        'updateProjectionMatrix'
      );

      facade.updateAspectRatio(1280, 720);

      const expectedAspect = 1280 / 720;
      expect(camera.aspect).toBeCloseTo(expectedAspect, 5);
      expect(updateProjectionMatrixSpy).toHaveBeenCalledOnce();
    });

    it('should handle square dimensions', () => {
      const camera = facade.getCamera();
      facade.updateAspectRatio(800, 800);

      expect(camera.aspect).toBe(1);
    });

    it('should handle wide aspect ratios', () => {
      const camera = facade.getCamera();
      facade.updateAspectRatio(3840, 1080);

      expect(camera.aspect).toBeCloseTo(3.556, 3);
    });

    it('should handle portrait dimensions', () => {
      const camera = facade.getCamera();
      facade.updateAspectRatio(1080, 1920);

      expect(camera.aspect).toBeCloseTo(0.5625, 5);
    });

    it('should update projection matrix after changing aspect ratio', () => {
      const camera = facade.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        camera,
        'updateProjectionMatrix'
      );

      facade.updateAspectRatio(2560, 1440);

      expect(updateProjectionMatrixSpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple resize calls', () => {
      const camera = facade.getCamera();
      const updateProjectionMatrixSpy = vi.spyOn(
        camera,
        'updateProjectionMatrix'
      );

      facade.updateAspectRatio(1280, 720);
      facade.updateAspectRatio(1920, 1080);
      facade.updateAspectRatio(800, 600);

      expect(updateProjectionMatrixSpy).toHaveBeenCalledTimes(3);
      expect(camera.aspect).toBeCloseTo(800 / 600, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small dimensions', () => {
      const camera = facade.getCamera();
      expect(() => facade.updateAspectRatio(1, 1)).not.toThrow();
      expect(camera.aspect).toBe(1);
    });

    it('should handle very large dimensions', () => {
      const camera = facade.getCamera();
      expect(() => facade.updateAspectRatio(7680, 4320)).not.toThrow();
      expect(camera.aspect).toBeCloseTo(7680 / 4320, 5);
    });
  });
});
