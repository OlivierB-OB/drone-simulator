import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Viewer3D } from './Viewer3D';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Scene } from './Scene';
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

  beforeEach(() => {
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

    // Create mock Three.js constructor classes
    const mockCameraConstructor = class MockCamera
      extends THREE.PerspectiveCamera
    {
      constructor(fov: number, aspect: number, near: number, far: number) {
        super(fov, aspect, near, far);
        mockCamera = this as unknown as THREE.PerspectiveCamera;
      }
    } as unknown as typeof THREE.PerspectiveCamera;

    const mockRendererConstructor = class MockRenderer {
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

    const mockSceneConstructor = class MockScene extends THREE.Scene {
      constructor() {
        super();
        mockScene = this as unknown as THREE.Scene;
        this.background = new THREE.Color(0x1a1a2e);
      }
    } as unknown as typeof THREE.Scene;

    // Create camera, renderer, and scene with injected mock constructors
    camera = new Camera(800, 600, mockCameraConstructor);
    renderer = new Renderer(800, 600, mockRendererConstructor);
    scene = new Scene(mockSceneConstructor);

    // Create viewer with injected components
    viewer = new Viewer3D(container, camera, renderer, scene);
  });

  afterEach(() => {
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
    it('should call renderer.render', () => {
      viewer.render();
      expect(mockRenderer.render).toHaveBeenCalled();
    });

    it('should not throw on multiple renders', () => {
      expect(() => {
        viewer.render();
        viewer.render();
        viewer.render();
      }).not.toThrow();
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
  });

  describe('dependency injection', () => {
    it('should use injected camera', () => {
      expect((viewer as any).camera).toBe(camera);
      expect((viewer as any).camera.getCamera()).toBe(mockCamera);
    });

    it('should use injected renderer', () => {
      expect((viewer as any).renderer).toBe(renderer);
      expect((viewer as any).renderer.getDomElement()).toBe(
        mockRenderer.domElement
      );
    });

    it('should use injected scene', () => {
      expect((viewer as any).scene).toBe(scene);
      expect((viewer as any).scene.getScene()).toBe(mockScene);
    });

    it('should append renderer DOM element to container', () => {
      expect(container.contains(mockRenderer.domElement)).toBe(true);
    });
  });
});
