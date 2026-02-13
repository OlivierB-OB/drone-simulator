import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneFacade } from './SceneFacade';
import * as THREE from 'three';

describe('SceneFacade', () => {
  let facade: SceneFacade;

  beforeEach(() => {
    facade = new SceneFacade();
  });

  describe('constructor', () => {
    it('should create a Three.js Scene', () => {
      const scene = facade.getScene();
      expect(scene).toBeInstanceOf(THREE.Scene);
    });

    it('should set background color to dark navy', () => {
      const scene = facade.getScene();
      const expectedColor = new THREE.Color(0x1a1a2e);

      expect(scene.background?.getHex()).toBe(expectedColor.getHex());
    });
  });

  describe('getScene()', () => {
    it('should return the internal scene instance', () => {
      const scene1 = facade.getScene();
      const scene2 = facade.getScene();

      expect(scene1).toBe(scene2); // Should be same reference
    });

    it('should return a Scene instance', () => {
      const scene = facade.getScene();
      expect(scene).toBeInstanceOf(THREE.Scene);
    });
  });

  describe('add()', () => {
    it('should add object to scene', () => {
      const scene = facade.getScene();
      const sceneAddSpy = vi.spyOn(scene, 'add');

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);

      facade.add(mesh);

      expect(sceneAddSpy).toHaveBeenCalledWith(mesh);
      expect(scene.children).toContain(mesh);
    });

    it('should handle multiple objects', () => {
      const scene = facade.getScene();

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const mesh3 = new THREE.Mesh();

      facade.add(mesh1);
      facade.add(mesh2);
      facade.add(mesh3);

      expect(scene.children).toContain(mesh1);
      expect(scene.children).toContain(mesh2);
      expect(scene.children).toContain(mesh3);
      expect(scene.children.length).toBe(3);
    });

    it('should add various object types', () => {
      const scene = facade.getScene();

      const mesh = new THREE.Mesh();
      const light = new THREE.DirectionalLight();
      const group = new THREE.Group();

      facade.add(mesh);
      facade.add(light);
      facade.add(group);

      expect(scene.children).toContain(mesh);
      expect(scene.children).toContain(light);
      expect(scene.children).toContain(group);
    });
  });

  describe('remove()', () => {
    it('should remove object from scene', () => {
      const scene = facade.getScene();
      const sceneRemoveSpy = vi.spyOn(scene, 'remove');

      const mesh = new THREE.Mesh();
      facade.add(mesh);
      expect(scene.children).toContain(mesh);

      facade.remove(mesh);

      expect(sceneRemoveSpy).toHaveBeenCalledWith(mesh);
      expect(scene.children).not.toContain(mesh);
    });

    it('should handle removing multiple objects', () => {
      const scene = facade.getScene();

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const mesh3 = new THREE.Mesh();

      facade.add(mesh1);
      facade.add(mesh2);
      facade.add(mesh3);

      facade.remove(mesh1);
      facade.remove(mesh3);

      expect(scene.children).not.toContain(mesh1);
      expect(scene.children).toContain(mesh2);
      expect(scene.children).not.toContain(mesh3);
      expect(scene.children.length).toBe(1);
    });

    it('should handle removing non-existent objects gracefully', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();

      facade.add(mesh1);

      expect(() => facade.remove(mesh2)).not.toThrow();
    });
  });

  describe('add and remove workflow', () => {
    it('should handle adding and removing same object multiple times', () => {
      const scene = facade.getScene();
      const mesh = new THREE.Mesh();

      facade.add(mesh);
      expect(scene.children).toContain(mesh);

      facade.remove(mesh);
      expect(scene.children).not.toContain(mesh);

      facade.add(mesh);
      expect(scene.children).toContain(mesh);
    });

    it('should maintain correct scene state after mixed operations', () => {
      const scene = facade.getScene();

      const meshA = new THREE.Mesh();
      const meshB = new THREE.Mesh();
      const meshC = new THREE.Mesh();

      facade.add(meshA);
      facade.add(meshB);
      facade.add(meshC);
      expect(scene.children.length).toBe(3);

      facade.remove(meshB);
      expect(scene.children.length).toBe(2);

      facade.add(meshB);
      expect(scene.children.length).toBe(3);

      facade.remove(meshA);
      facade.remove(meshC);
      expect(scene.children.length).toBe(1);
      expect(scene.children).toContain(meshB);
    });
  });

  describe('dependency injection', () => {
    it('should accept optional injected scene constructor and call it', () => {
      const constructorCalls: any[] = [];
      const mockConstructor = class MockScene extends THREE.Scene {
        constructor() {
          super();
          constructorCalls.push({});
        }
      } as unknown as typeof THREE.Scene;

      const facade = new SceneFacade(mockConstructor);
      const scene = facade.getScene();

      expect(constructorCalls).toHaveLength(1);
      expect(scene).toBeInstanceOf(THREE.Scene);
      expect(scene.background?.getHex()).toBe(
        new THREE.Color(0x1a1a2e).getHex()
      );
    });

    it('should initialize scene with correct background color through constructor', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const facade = new SceneFacade(mockConstructor);

      expect(facade.getScene().background?.getHex()).toBe(
        new THREE.Color(0x1a1a2e).getHex()
      );
    });

    it('should use injected scene constructor for add operations', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const facade = new SceneFacade(mockConstructor);
      const mesh = new THREE.Mesh();
      facade.add(mesh);

      expect(facade.getScene().children).toContain(mesh);
    });

    it('should use injected scene constructor for remove operations', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const facade = new SceneFacade(mockConstructor);
      const mesh = new THREE.Mesh();
      facade.add(mesh);
      facade.remove(mesh);

      expect(facade.getScene().children).not.toContain(mesh);
    });
  });
});
