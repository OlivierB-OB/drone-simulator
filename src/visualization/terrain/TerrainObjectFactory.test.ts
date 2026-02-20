import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  Mesh,
  BufferGeometry,
  Texture,
  MeshPhongMaterial,
  MeshBasicMaterial,
} from 'three';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObject } from './geometry/TerrainGeometryObject';
import { TerrainTextureObject } from './texture/TerrainTextureObject';
import { debugConfig } from '../../config';

describe('TerrainObjectFactory', () => {
  let factory: TerrainObjectFactory;
  let geometryObject: TerrainGeometryObject;
  let geometry: BufferGeometry;
  const tileKey = '9:261:168';
  const mercatorBounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };

  beforeEach(() => {
    geometry = new BufferGeometry();
    geometryObject = new TerrainGeometryObject(
      tileKey,
      geometry,
      mercatorBounds
    );
  });

  describe('constructor', () => {
    it('should use default Mesh and MeshPhongMaterial constructors', () => {
      factory = new TerrainObjectFactory();
      expect(factory).toBeDefined();
    });

    it('should accept optional injected constructors', () => {
      // Verify that we can pass constructors without error
      const customFactory = new TerrainObjectFactory(Mesh, MeshPhongMaterial);
      expect(customFactory).toBeDefined();
      const terrainObject = customFactory.createTerrainObject(geometryObject);
      expect(terrainObject).toBeDefined();
    });
  });

  describe('createTerrainObject', () => {
    beforeEach(() => {
      factory = new TerrainObjectFactory();
    });

    it('should create a TerrainObject with tile key and mesh', () => {
      const terrainObject = factory.createTerrainObject(geometryObject);

      expect(terrainObject.getTileKey()).toBe(tileKey);
      expect(terrainObject.getMesh()).toBeDefined();
    });

    it('should create a mesh with the provided geometry', () => {
      const terrainObject = factory.createTerrainObject(geometryObject);
      const mesh = terrainObject.getMesh();

      expect(mesh.geometry).toBe(geometry);
    });

    describe('material type', () => {
      const originalUseSimple = debugConfig.useSimpleTerrainMaterial;
      let textureObject: TerrainTextureObject;
      let texture: Texture;

      beforeEach(() => {
        (debugConfig as any).useSimpleTerrainMaterial = false;
        texture = new Texture();
        textureObject = new TerrainTextureObject(
          tileKey,
          texture,
          mercatorBounds
        );
      });

      afterEach(() => {
        (debugConfig as any).useSimpleTerrainMaterial = originalUseSimple;
      });

      it('should create a mesh with a MeshPhongMaterial when texture is provided', () => {
        const terrainObject = factory.createTerrainObject(
          geometryObject,
          textureObject
        );
        const mesh = terrainObject.getMesh();

        expect(mesh.material).toBeInstanceOf(MeshPhongMaterial);
      });

      it('should apply texture map to material', () => {
        const terrainObject = factory.createTerrainObject(
          geometryObject,
          textureObject
        );
        const mesh = terrainObject.getMesh();
        const material = mesh.material as MeshPhongMaterial;

        expect(material.map).toBe(texture);
      });
    });

    it('should create different mesh instances for each call', () => {
      const terrainObject1 = factory.createTerrainObject(geometryObject);
      const terrainObject2 = factory.createTerrainObject(geometryObject);

      expect(terrainObject1.getMesh()).not.toBe(terrainObject2.getMesh());
    });

    it('should create different material instances for each call', () => {
      const terrainObject1 = factory.createTerrainObject(geometryObject);
      const terrainObject2 = factory.createTerrainObject(geometryObject);

      expect(terrainObject1.getMesh().material).not.toBe(
        terrainObject2.getMesh().material
      );
    });

    it('should position mesh at tile center in Mercator space', () => {
      const terrainObject = factory.createTerrainObject(geometryObject);
      const mesh = terrainObject.getMesh();

      // Expected center: (0+1000)/2 = 500 for X, -500 for Z (negated Mercator Y)
      expect(mesh.position.x).toBe(500);
      expect(mesh.position.y).toBe(0);
      expect(mesh.position.z).toBe(-500);
    });

    describe('debug wireframe mode', () => {
      const originalUseSimple = debugConfig.useSimpleTerrainMaterial;

      afterEach(() => {
        (debugConfig as any).useSimpleTerrainMaterial = originalUseSimple;
      });

      it('should use wireframe rendering for debug material', () => {
        (debugConfig as any).useSimpleTerrainMaterial = true;
        const terrainObject = factory.createTerrainObject(geometryObject);
        const mesh = terrainObject.getMesh();
        const material = mesh.material as MeshBasicMaterial;

        expect(material.wireframe).toBe(true);
      });
    });
  });
});
