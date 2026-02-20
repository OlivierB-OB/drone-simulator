import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Camera } from './Camera';
import { cameraConfig } from '../config';
import { Drone } from '../drone/Drone';
import * as THREE from 'three';

describe('Camera', () => {
  let camera: Camera;
  let drone: Drone;

  beforeEach(() => {
    drone = new Drone({ x: 0, y: 0 });
    camera = new Camera(1920, 1080, drone);
  });

  describe('constructor', () => {
    it('should create a PerspectiveCamera with correct parameters', () => {
      const cameraInstance = camera.getObject();

      expect(cameraInstance).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(cameraInstance.fov).toBe(cameraConfig.fov);
      expect(cameraInstance.near).toBe(cameraConfig.near);
      expect(cameraInstance.far).toBe(cameraConfig.far);
    });

    it('should set correct aspect ratio based on dimensions', () => {
      const cameraInstance = camera.getObject();
      const expectedAspect = 1920 / 1080;

      expect(cameraInstance.aspect).toBeCloseTo(expectedAspect, 5);
    });

    it('should accept optional injected camera constructor', () => {
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
        drone,
        mockConstructor
      ).getObject();

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({
        fov: cameraConfig.fov,
        aspect: 1920 / 1080,
        near: cameraConfig.near,
        far: cameraConfig.far,
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

      new Camera(1920, 1080, drone, mockConstructor);

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({
        fov: cameraConfig.fov,
        aspect: 1920 / 1080,
        near: cameraConfig.near,
        far: cameraConfig.far,
      });
    });
  });

  describe('getCamera()', () => {
    it('should return the internal camera instance', () => {
      const camera1 = camera.getObject();
      const camera2 = camera.getObject();

      expect(camera1).toBe(camera2); // Should be same reference
    });

    it('should return a PerspectiveCamera', () => {
      const cameraInstance = camera.getObject();
      expect(cameraInstance).toBeInstanceOf(THREE.PerspectiveCamera);
    });
  });

  describe('updateAspectRatio()', () => {
    it('should update aspect ratio based on new dimensions', () => {
      const cameraInstance = camera.getObject();
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
      const cameraInstance = camera.getObject();
      camera.updateAspectRatio(800, 800);

      expect(cameraInstance.aspect).toBe(1);
    });

    it('should handle wide aspect ratios', () => {
      const cameraInstance = camera.getObject();
      camera.updateAspectRatio(3840, 1080);

      expect(cameraInstance.aspect).toBeCloseTo(3.556, 3);
    });

    it('should handle portrait dimensions', () => {
      const cameraInstance = camera.getObject();
      camera.updateAspectRatio(1080, 1920);

      expect(cameraInstance.aspect).toBeCloseTo(0.5625, 5);
    });

    it('should update projection matrix after changing aspect ratio', () => {
      const cameraInstance = camera.getObject();
      const updateProjectionMatrixSpy = vi.spyOn(
        cameraInstance,
        'updateProjectionMatrix'
      );

      camera.updateAspectRatio(2560, 1440);

      expect(updateProjectionMatrixSpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple resize calls', () => {
      const cameraInstance = camera.getObject();
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
      const cameraInstance = camera.getObject();

      camera.setPosition(10, 20, 30);

      expect(cameraInstance.position.x).toBe(10);
      expect(cameraInstance.position.y).toBe(20);
      expect(cameraInstance.position.z).toBe(30);
    });

    it('should handle negative coordinates', () => {
      const cameraInstance = camera.getObject();

      camera.setPosition(-100, -50, -25);

      expect(cameraInstance.position.x).toBe(-100);
      expect(cameraInstance.position.y).toBe(-50);
      expect(cameraInstance.position.z).toBe(-25);
    });

    it('should handle zero coordinates', () => {
      const cameraInstance = camera.getObject();

      camera.setPosition(0, 0, 0);

      expect(cameraInstance.position.x).toBe(0);
      expect(cameraInstance.position.y).toBe(0);
      expect(cameraInstance.position.z).toBe(0);
    });

    it('should allow multiple position updates', () => {
      const cameraInstance = camera.getObject();

      camera.setPosition(10, 20, 30);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(10, 20, 30));

      camera.setPosition(100, 200, 300);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(100, 200, 300));

      camera.setPosition(-5, -10, -15);
      expect(cameraInstance.position).toEqual(new THREE.Vector3(-5, -10, -15));
    });

    it('should handle fractional coordinates', () => {
      const cameraInstance = camera.getObject();

      camera.setPosition(1.5, 2.75, 3.333);

      expect(cameraInstance.position.x).toBeCloseTo(1.5, 5);
      expect(cameraInstance.position.y).toBeCloseTo(2.75, 5);
      expect(cameraInstance.position.z).toBeCloseTo(3.333, 5);
    });
  });

  describe('updateChaseCamera()', () => {
    it('should position camera behind drone facing North (azimuth 0)', () => {
      const cam = camera.getObject();

      // Drone at origin, elevation 10, facing North
      camera.updateChaseCamera(0, 10, 0, 0);

      // North = -Z in Three.js, so "behind" = +Z direction
      expect(cam.position.x).toBeCloseTo(0, 5);
      expect(cam.position.y).toBeCloseTo(10 + cameraConfig.chaseHeight, 5);
      expect(cam.position.z).toBeCloseTo(cameraConfig.chaseDistance, 5);
    });

    it('should position camera behind drone facing East (azimuth 90)', () => {
      const cam = camera.getObject();

      // Drone at origin, elevation 10, facing East
      camera.updateChaseCamera(0, 10, 0, 90);

      // East = +X in Three.js, so "behind" = -X direction
      expect(cam.position.x).toBeCloseTo(-cameraConfig.chaseDistance, 5);
      expect(cam.position.y).toBeCloseTo(10 + cameraConfig.chaseHeight, 5);
      expect(cam.position.z).toBeCloseTo(0, 5);
    });

    it('should position camera behind drone facing South (azimuth 180)', () => {
      const cam = camera.getObject();

      camera.updateChaseCamera(0, 10, 0, 180);

      // South = +Z in Three.js, so "behind" = -Z direction
      expect(cam.position.x).toBeCloseTo(0, 5);
      expect(cam.position.y).toBeCloseTo(10 + cameraConfig.chaseHeight, 5);
      expect(cam.position.z).toBeCloseTo(-cameraConfig.chaseDistance, 5);
    });

    it('should position camera behind drone facing West (azimuth 270)', () => {
      const cam = camera.getObject();

      camera.updateChaseCamera(0, 10, 0, 270);

      // West = -X in Three.js, so "behind" = +X direction
      expect(cam.position.x).toBeCloseTo(cameraConfig.chaseDistance, 5);
      expect(cam.position.y).toBeCloseTo(10 + cameraConfig.chaseHeight, 5);
      expect(cam.position.z).toBeCloseTo(0, 5);
    });

    it('should place camera at chaseHeight above the drone', () => {
      const cam = camera.getObject();
      const droneElevation = 50;

      camera.updateChaseCamera(100, droneElevation, -200, 0);

      expect(cam.position.y).toBeCloseTo(
        droneElevation + cameraConfig.chaseHeight,
        5
      );
    });

    it('should offset camera position relative to drone position', () => {
      const cam = camera.getObject();

      // Drone at non-origin position, facing North
      camera.updateChaseCamera(1000, 50, -5000, 0);

      expect(cam.position.x).toBeCloseTo(1000, 5);
      expect(cam.position.y).toBeCloseTo(50 + cameraConfig.chaseHeight, 5);
      expect(cam.position.z).toBeCloseTo(-5000 + cameraConfig.chaseDistance, 5);
    });

    it('should allow multiple chase camera updates', () => {
      const cam = camera.getObject();

      camera.updateChaseCamera(0, 10, 0, 0);
      expect(cam.position.z).toBeCloseTo(cameraConfig.chaseDistance, 5);

      camera.updateChaseCamera(0, 10, 0, 180);
      expect(cam.position.z).toBeCloseTo(-cameraConfig.chaseDistance, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small dimensions', () => {
      const cameraInstance = camera.getObject();
      expect(() => camera.updateAspectRatio(1, 1)).not.toThrow();
      expect(cameraInstance.aspect).toBe(1);
    });

    it('should handle very large dimensions', () => {
      const cameraInstance = camera.getObject();
      expect(() => camera.updateAspectRatio(7680, 4320)).not.toThrow();
      expect(cameraInstance.aspect).toBeCloseTo(7680 / 4320, 5);
    });

    it('should handle setPosition with very large values', () => {
      const cameraInstance = camera.getObject();

      camera.setPosition(10000, 10000, 10000);

      expect(cameraInstance.position.x).toBe(10000);
      expect(cameraInstance.position.y).toBe(10000);
      expect(cameraInstance.position.z).toBe(10000);
    });
  });
});
