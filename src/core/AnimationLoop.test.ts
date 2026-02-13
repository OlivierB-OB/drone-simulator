import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationLoop } from './AnimationLoop';
import { createDrone, Drone } from '../drone/Drone';

describe('AnimationLoop', () => {
  let animationLoop: AnimationLoop;
  let drone: Drone;
  let mockViewer3D: any;

  beforeEach(() => {
    drone = createDrone();

    // Mock Viewer3D
    mockViewer3D = {
      render: vi.fn(),
    };

    animationLoop = new AnimationLoop(mockViewer3D, drone);

    // Mock requestAnimationFrame to capture the callback
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: unknown) => {
        // Store the callback on the AnimationLoop for testing
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

      // Get the callback and invoke it
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
        // Verify delta time is calculated for subsequent frames
        droneSpy.mockClear();
        callback(0);
        const firstCallDelta = droneSpy.mock.calls[0]?.[0];

        droneSpy.mockClear();
        callback(1000);
        const secondCallDelta = droneSpy.mock.calls[0]?.[0];

        // Second frame should have larger delta time than first
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

  describe('integration', () => {
    it('should coordinate drone and rendering', () => {
      const droneSpy = vi.spyOn(drone, 'applyMove');

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(0);
        // Verify both were called
        expect(droneSpy).toHaveBeenCalled();
        expect(mockViewer3D.render).toHaveBeenCalled();
      }
    });
  });
});
