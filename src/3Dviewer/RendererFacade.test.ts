import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RendererFacade } from './RendererFacade';

describe('RendererFacade', () => {
  let facade: RendererFacade;

  beforeEach(() => {
    // Set device pixel ratio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });

    // Create mock WebGL renderer for testing
    const mockRenderer = {
      domElement: document.createElement('canvas'),
      render: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
    } as any;

    mockRenderer.domElement.width = 1920;
    mockRenderer.domElement.height = 1080;

    // Inject mock renderer to avoid WebGL context errors
    facade = new RendererFacade(1920, 1080, mockRenderer);
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
    it('should accept optional injected renderer', () => {
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        render: vi.fn(),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        dispose: vi.fn(),
      } as any;

      mockRenderer.domElement.width = 800;
      mockRenderer.domElement.height = 600;

      const injectedFacade = new RendererFacade(800, 600, mockRenderer);
      const element = injectedFacade.getDomElement();

      expect(element).toBe(mockRenderer.domElement);
      expect(element.width).toBe(800);
      expect(element.height).toBe(600);
    });

    it('should use injected renderer for render calls', () => {
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        render: vi.fn(),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        dispose: vi.fn(),
      } as any;

      const injectedFacade = new RendererFacade(800, 600, mockRenderer);
      const mockScene = {} as any;
      const mockCamera = {} as any;

      injectedFacade.render(mockScene, mockCamera);

      expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });

    it('should use injected renderer for setSize calls', () => {
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        render: vi.fn(),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        dispose: vi.fn(),
      } as any;

      const injectedFacade = new RendererFacade(800, 600, mockRenderer);

      injectedFacade.setSize(1024, 768);

      expect(mockRenderer.setSize).toHaveBeenCalledWith(1024, 768);
    });

    it('should use injected renderer for dispose calls', () => {
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        render: vi.fn(),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        dispose: vi.fn(),
      } as any;

      const injectedFacade = new RendererFacade(800, 600, mockRenderer);

      injectedFacade.dispose();

      expect(mockRenderer.dispose).toHaveBeenCalledOnce();
    });
  });
});
