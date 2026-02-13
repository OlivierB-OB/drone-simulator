import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Viewer3D } from './Viewer3D';
import { CameraFacade } from './CameraFacade';
import { RendererFacade } from './RendererFacade';
import { SceneFacade } from './SceneFacade';
import * as THREE from 'three';

describe('Viewer3D', () => {
  let container: HTMLDivElement;
  let viewer: Viewer3D;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderer: any;
  let mockScene: THREE.Scene;
  let cameraFacade: CameraFacade;
  let rendererFacade: RendererFacade;
  let sceneFacade: SceneFacade;

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

    // Create mock Three.js objects
    mockCamera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    mockCamera.position.z = 5;

    mockRenderer = {
      domElement: document.createElement('canvas'),
      render: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
    };
    mockRenderer.domElement.width = 800;
    mockRenderer.domElement.height = 600;

    mockScene = new THREE.Scene();
    mockScene.background = new THREE.Color(0x1a1a2e);

    // Create facades with injected mocks
    cameraFacade = new CameraFacade(800, 600, mockCamera);
    rendererFacade = new RendererFacade(800, 600, mockRenderer);
    sceneFacade = new SceneFacade(mockScene);

    // Create viewer with injected facades
    viewer = new Viewer3D(container, cameraFacade, rendererFacade, sceneFacade);
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

    it('should initialize with a cube', () => {
      const cube = (viewer as any).cube;
      expect(cube).toBeDefined();
      expect(cube).not.toBeNull();
    });

    it('should setup resize handler', () => {
      const resizeHandler = (viewer as any).resizeHandler;
      expect(resizeHandler).toBeDefined();
      expect(typeof resizeHandler).toBe('function');
    });
  });

  describe('initializeScene()', () => {
    it('should have created a mesh', () => {
      const cube = (viewer as any).cube;
      expect(cube.type).toBe('Mesh');
    });

    it('should have box geometry', () => {
      const cube = (viewer as any).cube;
      expect(cube.geometry.type).toBe('BoxGeometry');
    });

    it('should have green material', () => {
      const cube = (viewer as any).cube;
      const color = (cube.material as any).color.getHex();
      expect(color).toBe(0x00ff00);
    });
  });

  describe('render()', () => {
    it('should rotate cube on render', () => {
      const cube = (viewer as any).cube;
      const initialRotationX = cube.rotation.x;
      const initialRotationY = cube.rotation.y;

      viewer.render();

      expect(cube.rotation.x).toBe(initialRotationX + 0.01);
      expect(cube.rotation.y).toBe(initialRotationY + 0.01);
    });

    it('should accumulate rotation', () => {
      const cube = (viewer as any).cube;
      const initialRotationX = cube.rotation.x;

      viewer.render();
      viewer.render();
      viewer.render();

      expect(cube.rotation.x).toBeCloseTo(initialRotationX + 0.03, 5);
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
    it('should use injected camera facade', () => {
      expect((viewer as any).cameraFacade).toBe(cameraFacade);
      expect((viewer as any).cameraFacade.getCamera()).toBe(mockCamera);
    });

    it('should use injected renderer facade', () => {
      expect((viewer as any).rendererFacade).toBe(rendererFacade);
      expect((viewer as any).rendererFacade.getDomElement()).toBe(
        mockRenderer.domElement
      );
    });

    it('should use injected scene facade', () => {
      expect((viewer as any).sceneFacade).toBe(sceneFacade);
      expect((viewer as any).sceneFacade.getScene()).toBe(mockScene);
    });

    it('should append renderer DOM element to container', () => {
      expect(container.contains(mockRenderer.domElement)).toBe(true);
    });

    it('should add cube to injected scene', () => {
      const cube = (viewer as any).cube;
      expect(mockScene.children).toContain(cube);
    });
  });
});
