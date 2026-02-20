import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationLoop } from './AnimationLoop';
import { createDrone, Drone } from '../drone/Drone';

describe('AnimationLoop', () => {
  let animationLoop: AnimationLoop;
  let drone: Drone;
  let mockViewer3D: any;
  let mockCamera: any;
  let mockDroneObject: any;

  beforeEach(() => {
    drone = createDrone();

    mockViewer3D = {
      render: vi.fn(),
    };

    mockCamera = {
      updateChaseCamera: vi.fn(),
    };

    mockDroneObject = {
      animateRotors: vi.fn(),
    };

    animationLoop = new AnimationLoop(
      mockViewer3D,
      drone,
      mockCamera,
      mockDroneObject
    );

    // Mock requestAnimationFrame to capture the callback
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: unknown) => {
        (animationLoop as any).__testCallback = callback;
        return 1;
      })
    );

    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('start()', () => {
    it('should request animation frame when started', () => {
      animationLoop.start();
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should call drone.applyMove on animation frame', () => {
      const droneSpy = vi.spyOn(drone, 'applyMove');
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        expect(droneSpy).toHaveBeenCalled();
      }
    });

    it('should render scene each frame', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        expect(mockViewer3D.render).toHaveBeenCalled();
      }
    });

    it('should calculate delta time correctly', () => {
      const droneSpy = vi.spyOn(drone, 'applyMove');
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        droneSpy.mockClear();
        callback(0);
        const firstCallDelta = droneSpy.mock.calls[0]?.[0];

        droneSpy.mockClear();
        callback(1000);
        const secondCallDelta = droneSpy.mock.calls[0]?.[0];

        expect(secondCallDelta).toBeGreaterThanOrEqual(firstCallDelta!);
      }
    });
  });

  describe('dispose()', () => {
    it('should cancel animation frame when disposed', () => {
      animationLoop.start();
      animationLoop.dispose();

      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle dispose without start', () => {
      expect(() => animationLoop.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      animationLoop.start();
      expect(() => {
        animationLoop.dispose();
        animationLoop.dispose();
      }).not.toThrow();
    });
  });

  describe('camera coordination', () => {
    it('should not call camera directly - camera updates via Drone events', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        // Camera is no longer called from AnimationLoop - it subscribes to Drone events
        expect(mockCamera.updateChaseCamera).not.toHaveBeenCalled();
      }
    });
  });

  describe('drone object coordination', () => {
    it('should call droneObject.animateRotors on animation frame', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        expect(mockDroneObject.animateRotors).toHaveBeenCalled();
      }
    });

    it('should call animateRotors multiple times for continuous animation', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        mockDroneObject.animateRotors.mockClear();

        callback(200);

        expect(mockDroneObject.animateRotors).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('execution order', () => {
    it('should execute in correct order: applyMove -> animateRotors -> render', () => {
      const callOrder: string[] = [];
      vi.spyOn(drone, 'applyMove').mockImplementation(() => {
        callOrder.push('applyMove');
      });
      mockDroneObject.animateRotors.mockImplementation(() => {
        callOrder.push('animateRotors');
      });
      mockViewer3D.render.mockImplementation(() => {
        callOrder.push('render');
      });

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(0);
        callOrder.length = 0;
        callback(100);

        expect(callOrder).toEqual(['applyMove', 'animateRotors', 'render']);
      }
    });
  });

  describe('integration', () => {
    it('should coordinate drone, drone object, and rendering', () => {
      const droneSpy = vi.spyOn(drone, 'applyMove');

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(0);
        expect(droneSpy).toHaveBeenCalled();
        expect(mockDroneObject.animateRotors).toHaveBeenCalled();
        expect(mockViewer3D.render).toHaveBeenCalled();
      }
    });
  });
});
