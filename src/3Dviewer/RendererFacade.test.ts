import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RendererFacade } from './RendererFacade';
import { WebGLRenderer } from 'three';

describe('RendererFacade', () => {
  let facade: RendererFacade;

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
    facade = new RendererFacade(1920, 1080, mockRendererConstructor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDomElement()', () => {
    it('should return an HTMLCanvasElement', () => {
      const element = facade.getDomElement();
      expect(element).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should return a valid canvas element', () => {
      const element = facade.getDomElement();
      expect(element).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should have reasonable dimensions', () => {
      const element = facade.getDomElement();
      expect(element.width).toBeGreaterThan(0);
      expect(element.height).toBeGreaterThan(0);
    });
  });

  describe('render()', () => {
    it('should have render method', () => {
      expect(typeof facade.render).toBe('function');
    });
  });

  describe('setSize()', () => {
    it('should have setSize method', () => {
      expect(typeof facade.setSize).toBe('function');
    });
  });

  describe('dispose()', () => {
    it('should have dispose method', () => {
      expect(typeof facade.dispose).toBe('function');
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

      const injectedFacade = new RendererFacade(800, 600, mockConstructor);
      const element = injectedFacade.getDomElement();

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

      new RendererFacade(800, 600, mockConstructor);

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

      new RendererFacade(800, 600, mockConstructor);

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

      new RendererFacade(800, 600, mockConstructor);

      expect(setPixelRatioCalls).toHaveLength(1);
      expect(setPixelRatioCalls[0]).toEqual([window.devicePixelRatio]);
    });
  });
});
