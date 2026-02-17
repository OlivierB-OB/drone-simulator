import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnimationLoop } from './AnimationLoop';
import { createDrone, Drone } from '../drone/Drone';

describe('AnimationLoop', () => {
  let animationLoop: AnimationLoop;
  let drone: Drone;
  let mockViewer3D: any;
  let mockCamera: any;
  let mockElevationData: any;
  let mockContextData: any;

  beforeEach(() => {
    drone = createDrone();

    // Mock Viewer3D
    mockViewer3D = {
      render: vi.fn(),
    };

    // Mock Camera
    mockCamera = {
      setPosition: vi.fn(),
      setOrientation: vi.fn(),
    };

    // Mock ElevationDataManager
    mockElevationData = {
      setLocation: vi.fn(),
    };

    // Mock ContextDataManager
    mockContextData = {
      setLocation: vi.fn(),
    };

    animationLoop = new AnimationLoop(
      mockViewer3D,
      drone,
      mockElevationData,
      mockContextData,
      mockCamera
    );

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

  describe('camera coordination', () => {
    it('should call camera.setPosition on animation frame', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        expect(mockCamera.setPosition).toHaveBeenCalled();
      }
    });

    it('should call camera.setOrientation on animation frame', () => {
      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);
        expect(mockCamera.setOrientation).toHaveBeenCalled();
      }
    });

    it('should position camera at drone location plus 5 unit offset', () => {
      const droneLocation = drone.getLocation();
      const droneElevation = drone.getElevation();

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);

        expect(mockCamera.setPosition).toHaveBeenCalledWith(
          droneLocation.x,
          droneLocation.y,
          droneElevation + 5
        );
      }
    });

    it('should orient camera to drone azimuth', () => {
      const droneAzimuth = drone.getAzimuth();

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(100);

        expect(mockCamera.setOrientation).toHaveBeenCalledWith(droneAzimuth);
      }
    });

    it('should update camera position multiple times as drone moves', () => {
      // Get initial position
      const initialLocation = drone.getLocation();

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        // First call - verify camera is at initial position + 5
        callback(0);
        expect(mockCamera.setPosition).toHaveBeenCalledWith(
          initialLocation.x,
          initialLocation.y,
          5
        );

        // Start moving forward for next frame
        drone.startMovingForward();
        mockCamera.setPosition.mockClear();

        // Second call - with movement
        callback(1000);

        // Verify setPosition was called again (even if with slightly different values)
        expect(mockCamera.setPosition).toHaveBeenCalled();
      }
    });

    it('should execute in correct order: applyMove -> setPosition -> setOrientation -> render', () => {
      const callOrder: string[] = [];
      vi.spyOn(drone, 'applyMove').mockImplementation(() => {
        callOrder.push('applyMove');
      });
      mockCamera.setPosition.mockImplementation(() => {
        callOrder.push('setPosition');
      });
      mockCamera.setOrientation.mockImplementation(() => {
        callOrder.push('setOrientation');
      });
      mockViewer3D.render.mockImplementation(() => {
        callOrder.push('render');
      });

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        // Only test the second call where delta time is non-zero
        callback(0); // First call
        callOrder.length = 0; // Clear the order
        callback(100); // Second call

        expect(callOrder).toEqual([
          'applyMove',
          'setPosition',
          'setOrientation',
          'render',
        ]);
      }
    });
  });

  describe('integration', () => {
    it('should coordinate drone, camera, and rendering', () => {
      const droneSpy = vi.spyOn(drone, 'applyMove');

      animationLoop.start();

      const callback = (animationLoop as any).__testCallback;
      if (callback) {
        callback(0);
        // Verify all components were called
        expect(droneSpy).toHaveBeenCalled();
        expect(mockCamera.setPosition).toHaveBeenCalled();
        expect(mockCamera.setOrientation).toHaveBeenCalled();
        expect(mockViewer3D.render).toHaveBeenCalled();
      }
    });
  });
});
