import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scene } from './Scene';
import { sceneConfig } from '../config';
import * as THREE from 'three';

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene();
  });

  describe('constructor', () => {
    it('should create a Three.js Scene', () => {
      const sceneInstance = scene.getScene();
      expect(sceneInstance).toBeInstanceOf(THREE.Scene);
    });

    it('should set background color to dark navy', () => {
      const sceneInstance = scene.getScene();
      const expectedColor = new THREE.Color(sceneConfig.backgroundColor);

      expect(sceneInstance.background?.getHex()).toBe(expectedColor.getHex());
    });
  });

  describe('getScene()', () => {
    it('should return the internal scene instance', () => {
      const scene1 = scene.getScene();
      const scene2 = scene.getScene();

      expect(scene1).toBe(scene2); // Should be same reference
    });

    it('should return a Scene instance', () => {
      const sceneInstance = scene.getScene();
      expect(sceneInstance).toBeInstanceOf(THREE.Scene);
    });
  });

  describe('add()', () => {
    it('should add object to scene', () => {
      const sceneInstance = scene.getScene();
      const sceneAddSpy = vi.spyOn(sceneInstance, 'add');

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);

      scene.add(mesh);

      expect(sceneAddSpy).toHaveBeenCalledWith(mesh);
      expect(sceneInstance.children).toContain(mesh);
    });

    it('should handle multiple objects', () => {
      const sceneInstance = scene.getScene();
      const initialChildCount = sceneInstance.children.length; // Account for lights added in constructor

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const mesh3 = new THREE.Mesh();

      scene.add(mesh1);
      scene.add(mesh2);
      scene.add(mesh3);

      expect(sceneInstance.children).toContain(mesh1);
      expect(sceneInstance.children).toContain(mesh2);
      expect(sceneInstance.children).toContain(mesh3);
      expect(sceneInstance.children.length).toBe(initialChildCount + 3);
    });

    it('should add various object types', () => {
      const sceneInstance = scene.getScene();

      const mesh = new THREE.Mesh();
      const light = new THREE.DirectionalLight();
      const group = new THREE.Group();

      scene.add(mesh);
      scene.add(light);
      scene.add(group);

      expect(sceneInstance.children).toContain(mesh);
      expect(sceneInstance.children).toContain(light);
      expect(sceneInstance.children).toContain(group);
    });
  });

  describe('remove()', () => {
    it('should remove object from scene', () => {
      const sceneInstance = scene.getScene();
      const sceneRemoveSpy = vi.spyOn(sceneInstance, 'remove');

      const mesh = new THREE.Mesh();
      scene.add(mesh);
      expect(sceneInstance.children).toContain(mesh);

      scene.remove(mesh);

      expect(sceneRemoveSpy).toHaveBeenCalledWith(mesh);
      expect(sceneInstance.children).not.toContain(mesh);
    });

    it('should handle removing multiple objects', () => {
      const sceneInstance = scene.getScene();
      const initialChildCount = sceneInstance.children.length; // Account for lights added in constructor

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      const mesh3 = new THREE.Mesh();

      scene.add(mesh1);
      scene.add(mesh2);
      scene.add(mesh3);

      scene.remove(mesh1);
      scene.remove(mesh3);

      expect(sceneInstance.children).not.toContain(mesh1);
      expect(sceneInstance.children).toContain(mesh2);
      expect(sceneInstance.children).not.toContain(mesh3);
      expect(sceneInstance.children.length).toBe(initialChildCount + 1);
    });

    it('should handle removing non-existent objects gracefully', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();

      scene.add(mesh1);

      expect(() => scene.remove(mesh2)).not.toThrow();
    });
  });

  describe('add and remove workflow', () => {
    it('should handle adding and removing same object multiple times', () => {
      const sceneInstance = scene.getScene();
      const mesh = new THREE.Mesh();

      scene.add(mesh);
      expect(sceneInstance.children).toContain(mesh);

      scene.remove(mesh);
      expect(sceneInstance.children).not.toContain(mesh);

      scene.add(mesh);
      expect(sceneInstance.children).toContain(mesh);
    });

    it('should maintain correct scene state after mixed operations', () => {
      const sceneInstance = scene.getScene();
      const initialChildCount = sceneInstance.children.length; // Account for lights added in constructor

      const meshA = new THREE.Mesh();
      const meshB = new THREE.Mesh();
      const meshC = new THREE.Mesh();

      scene.add(meshA);
      scene.add(meshB);
      scene.add(meshC);
      expect(sceneInstance.children.length).toBe(initialChildCount + 3);

      scene.remove(meshB);
      expect(sceneInstance.children.length).toBe(initialChildCount + 2);

      scene.add(meshB);
      expect(sceneInstance.children.length).toBe(initialChildCount + 3);

      scene.remove(meshA);
      scene.remove(meshC);
      expect(sceneInstance.children.length).toBe(initialChildCount + 1);
      expect(sceneInstance.children).toContain(meshB);
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

      const injectedScene = new Scene(mockConstructor);
      const sceneInstance = injectedScene.getScene();

      expect(constructorCalls).toHaveLength(1);
      expect(sceneInstance).toBeInstanceOf(THREE.Scene);
      expect(sceneInstance.background?.getHex()).toBe(
        new THREE.Color(sceneConfig.backgroundColor).getHex()
      );
    });

    it('should initialize scene with correct background color through constructor', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const injectedScene = new Scene(mockConstructor);

      expect(injectedScene.getScene().background?.getHex()).toBe(
        new THREE.Color(sceneConfig.backgroundColor).getHex()
      );
    });

    it('should use injected scene constructor for add operations', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const injectedScene = new Scene(mockConstructor);
      const mesh = new THREE.Mesh();
      injectedScene.add(mesh);

      expect(injectedScene.getScene().children).toContain(mesh);
    });

    it('should use injected scene constructor for remove operations', () => {
      const mockConstructor = class MockScene
        extends THREE.Scene {} as unknown as typeof THREE.Scene;

      const injectedScene = new Scene(mockConstructor);
      const mesh = new THREE.Mesh();
      injectedScene.add(mesh);
      injectedScene.remove(mesh);

      expect(injectedScene.getScene().children).not.toContain(mesh);
    });
  });
});
