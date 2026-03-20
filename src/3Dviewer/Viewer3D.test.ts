import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Viewer3D } from './Viewer3D';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Scene } from './Scene';
import { Drone } from '../drone/Drone';
import * as THREE from 'three';

describe('Viewer3D', () => {
  let container: HTMLDivElement;
  let viewer: Viewer3D;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderer: any;
  let mockScene: THREE.Scene;
  let camera: Camera;
  let renderer: Renderer;
  let scene: Scene;
  let drone: Drone;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafIdCounter: number;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;

  function flushRaf() {
    const callbacks = [...rafCallbacks.values()];
    rafCallbacks.clear();
    callbacks.forEach((cb) => cb(0));
  }

  beforeEach(() => {
    // Stub RAF globals before viewer creation
    rafCallbacks = new Map();
    rafIdCounter = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++rafIdCounter;
      rafCallbacks.set(id, cb);
      return id;
    });
    mockCancelAnimationFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);

    // Create a container with specific dimensions
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    Object.defineProperty(container, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(container, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });
    document.body.appendChild(container);

    // Create a drone instance
    drone = new Drone({ lat: 0, lng: 0 });

    // Create mock Three.js constructor classes
    const mockThreeCameraConstructor = class MockCamera
      extends THREE.PerspectiveCamera
    {
      constructor(fov: number, aspect: number, near: number, far: number) {
        super(fov, aspect, near, far);
        mockCamera = this as unknown as THREE.PerspectiveCamera;
      }
    } as unknown as typeof THREE.PerspectiveCamera;

    const mockThreeRendererConstructor = class MockRenderer {
      domElement = document.createElement('canvas');
      render = vi.fn();
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      dispose = vi.fn();

      constructor() {
        mockRenderer = this as unknown as typeof mockRenderer;
        this.domElement.width = 800;
        this.domElement.height = 600;
      }
    } as unknown as typeof THREE.WebGLRenderer;

    const mockThreeSceneConstructor = class MockScene extends THREE.Scene {
      constructor() {
        super();
        mockScene = this as unknown as THREE.Scene;
        this.background = new THREE.Color(0x1a1a2e);
      }
    } as unknown as typeof THREE.Scene;

    // Create Camera, Renderer, Scene with mocked Three.js constructors
    const mockCameraConstructor = class MockCameraClass extends Camera {
      constructor(width: number, height: number, d: Drone) {
        super(width, height, d, mockThreeCameraConstructor);
      }
    } as unknown as typeof Camera;

    const mockRendererConstructor = class MockRendererClass extends Renderer {
      constructor(width: number, height: number) {
        super(width, height, mockThreeRendererConstructor);
      }
    } as unknown as typeof Renderer;

    const mockSceneConstructor = class MockSceneClass extends Scene {
      constructor(onChanged: () => void) {
        super(onChanged, mockThreeSceneConstructor);
      }
    } as unknown as typeof Scene;

    // Create viewer with injected constructors
    viewer = new Viewer3D(
      container,
      drone,
      mockCameraConstructor,
      mockRendererConstructor,
      mockSceneConstructor
    );

    // Get instances from viewer for testing
    camera = viewer.getCamera();
    scene = viewer.getScene();
    renderer = (viewer as any).renderer;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    try {
      viewer.dispose();
    } catch {
      // Ignore disposal errors
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('constructor', () => {
    it('should create viewer successfully', () => {
      expect(viewer).toBeDefined();
    });

    it('should setup resize handler', () => {
      const resizeHandler = (viewer as any).resizeHandler;
      expect(resizeHandler).toBeDefined();
      expect(typeof resizeHandler).toBe('function');
    });
  });

  describe('render()', () => {
    it('should call renderer.render after frame flush', () => {
      viewer.render();
      flushRaf();
      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it('should not throw on multiple renders', () => {
      expect(() => {
        viewer.render();
        viewer.render();
        viewer.render();
        flushRaf();
      }).not.toThrow();
    });

    it('should coalesce multiple render() calls into one actual render', () => {
      viewer.render();
      viewer.render();
      viewer.render();
      flushRaf();
      expect(mockRenderer.render).toHaveBeenCalledTimes(1);
    });

    it('should allow a new render() after the frame flushes', () => {
      viewer.render();
      flushRaf();
      mockRenderer.render.mockClear();

      viewer.render();
      flushRaf();
      expect(mockRenderer.render).toHaveBeenCalledTimes(1);
    });

    it('should auto-render when an object is added to the scene', () => {
      mockRenderer.render.mockClear();
      const mesh = new THREE.Mesh();
      scene.add(mesh);
      flushRaf();
      expect(mockRenderer.render).toHaveBeenCalledTimes(1);
    });

    it('should auto-render when an object is removed from the scene', () => {
      const mesh = new THREE.Mesh();
      scene.add(mesh);
      flushRaf();
      mockRenderer.render.mockClear();
      scene.remove(mesh);
      flushRaf();
      expect(mockRenderer.render).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose()', () => {
    it('should not throw on dispose', () => {
      expect(() => {
        viewer.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      expect(() => {
        viewer.dispose();
        viewer.dispose();
      }).not.toThrow();
    });

    it('should cancel a pending frame on dispose', () => {
      viewer.render();
      const pendingId = (viewer as any).pendingFrameId;
      viewer.dispose();
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(pendingId);
    });
  });

  describe('dependency injection', () => {
    it('should use injected camera', () => {
      expect((viewer as any).camera).toBe(camera);
      expect((viewer as any).camera.getObject()).toBe(mockCamera);
    });

    it('should use injected renderer', () => {
      expect((viewer as any).renderer).toBe(renderer);
      expect((viewer as any).renderer.getDomElement()).toBe(
        mockRenderer.domElement
      );
    });

    it('should use injected scene', () => {
      expect((viewer as any).scene).toBe(scene);
      expect((viewer as any).scene.getObject()).toBe(mockScene);
    });

    it('should append renderer DOM element to container', () => {
      expect(container.contains(mockRenderer.domElement)).toBe(true);
    });
  });
});
