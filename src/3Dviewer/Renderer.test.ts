import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from './Renderer';
import { WebGLRenderer } from 'three';

describe('Renderer', () => {
  let renderer: Renderer;

  beforeEach(() => {
    // Set device pixel ratio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });

    // Create mock WebGL renderer constructor for testing
    const mockRendererConstructor = class MockRenderer {
      domElement = document.createElement('canvas');
      render = vi.fn();
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      dispose = vi.fn();

      constructor() {}
    } as unknown as typeof WebGLRenderer;

    // Inject mock renderer constructor to avoid WebGL context errors
    renderer = new Renderer(1920, 1080, mockRendererConstructor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDomElement()', () => {
    it('should return an HTMLCanvasElement', () => {
      const element = renderer.getDomElement();
      expect(element).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should return a valid canvas element', () => {
      const element = renderer.getDomElement();
      expect(element).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should have reasonable dimensions', () => {
      const element = renderer.getDomElement();
      expect(element.width).toBeGreaterThan(0);
      expect(element.height).toBeGreaterThan(0);
    });
  });

  describe('render()', () => {
    it('should have render method', () => {
      expect(typeof renderer.render).toBe('function');
    });
  });

  describe('setSize()', () => {
    it('should have setSize method', () => {
      expect(typeof renderer.setSize).toBe('function');
    });
  });

  describe('dispose()', () => {
    it('should have dispose method', () => {
      expect(typeof renderer.dispose).toBe('function');
    });
  });

  describe('dependency injection', () => {
    it('should accept optional injected renderer constructor', () => {
      const constructorCalls: any[] = [];
      const mockConstructor = class MockRenderer {
        domElement = document.createElement('canvas');
        render = vi.fn();
        setSize = vi.fn();
        setPixelRatio = vi.fn();
        dispose = vi.fn();

        constructor(options?: any) {
          constructorCalls.push(options);
        }
      } as unknown as typeof WebGLRenderer;

      const injectedRenderer = new Renderer(800, 600, mockConstructor);
      const element = injectedRenderer.getDomElement();

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({ antialias: true });
      expect(element).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should initialize renderer with correct parameters through constructor', () => {
      const constructorCalls: any[] = [];
      const mockConstructor = class MockRenderer {
        domElement = document.createElement('canvas');
        render = vi.fn();
        setSize = vi.fn();
        setPixelRatio = vi.fn();
        dispose = vi.fn();

        constructor(options?: any) {
          constructorCalls.push(options);
        }
      } as unknown as typeof WebGLRenderer;

      new Renderer(800, 600, mockConstructor);

      expect(constructorCalls).toHaveLength(1);
      expect(constructorCalls[0]).toEqual({ antialias: true });
    });

    it('should call setSize with correct dimensions on constructor', () => {
      const setSizeCalls: any[] = [];
      const mockConstructor = class MockRenderer {
        domElement = document.createElement('canvas');
        render = vi.fn();
        setSize = vi.fn((...args: any[]) => {
          setSizeCalls.push(args);
        });
        setPixelRatio = vi.fn();
        dispose = vi.fn();

        constructor() {}
      } as unknown as typeof WebGLRenderer;

      new Renderer(800, 600, mockConstructor);

      expect(setSizeCalls).toHaveLength(1);
      expect(setSizeCalls[0]).toEqual([800, 600]);
    });

    it('should call setPixelRatio with device pixel ratio on constructor', () => {
      const setPixelRatioCalls: any[] = [];
      const mockConstructor = class MockRenderer {
        domElement = document.createElement('canvas');
        render = vi.fn();
        setSize = vi.fn();
        setPixelRatio = vi.fn((...args: any[]) => {
          setPixelRatioCalls.push(args);
        });
        dispose = vi.fn();

        constructor() {}
      } as unknown as typeof WebGLRenderer;

      new Renderer(800, 600, mockConstructor);

      expect(setPixelRatioCalls).toHaveLength(1);
      expect(setPixelRatioCalls[0]).toEqual([window.devicePixelRatio]);
    });
  });
});
