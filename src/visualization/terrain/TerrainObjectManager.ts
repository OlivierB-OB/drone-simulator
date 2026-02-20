import { Scene } from '../../3Dviewer/Scene';
import { TerrainObject } from './TerrainObject';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import type { TerrainTextureObjectManager } from './texture/TerrainTextureObjectManager';
import type { TileKey } from './geometry/types';
import type { TerrainGeometryObjectManagerEvents } from './geometry/TerrainGeometryObjectManager';
import type { TerrainTextureObjectManagerEvents } from './texture/TerrainTextureObjectManager';

/**
 * Manages a collection of TerrainObject instances in the 3D scene.
 * Orchestrates TerrainGeometryObjectManager and TerrainTextureObjectManager
 * to create and manage terrain objects.
 */
export class TerrainObjectManager {
  private readonly objects: Map<TileKey, TerrainObject>;
  private readonly scene: Scene;
  private readonly geometryManager: TerrainGeometryObjectManager;
  private readonly textureManager: TerrainTextureObjectManager | undefined;
  private readonly factory: TerrainObjectFactory;
  private onGeometryAdded:
    | ((data: TerrainGeometryObjectManagerEvents['geometryAdded']) => void)
    | null = null;
  private onGeometryRemoved:
    | ((data: TerrainGeometryObjectManagerEvents['geometryRemoved']) => void)
    | null = null;
  private onTextureAdded:
    | ((data: TerrainTextureObjectManagerEvents['textureAdded']) => void)
    | null = null;
  private onTextureRemoved: (() => void) | null = null;

  constructor(
    scene: Scene,
    geometryManager: TerrainGeometryObjectManager,
    textureManager?: TerrainTextureObjectManager,
    factory?: TerrainObjectFactory
  ) {
    this.scene = scene;
    this.geometryManager = geometryManager;
    this.textureManager = textureManager;
    this.factory = factory ?? new TerrainObjectFactory();
    this.objects = new Map();

    // Subscribe to geometry and texture manager tile events
    this.onGeometryAdded = (data) => {
      this.handleGeometryAdded(data);
    };
    this.geometryManager.on('geometryAdded', this.onGeometryAdded);

    this.onGeometryRemoved = (data) => {
      this.handleGeometryRemoved(data);
    };
    this.geometryManager.on('geometryRemoved', this.onGeometryRemoved);

    this.onTextureAdded = (data) => {
      this.handleTextureAdded(data);
    };
    this.textureManager?.on('textureAdded', this.onTextureAdded);

    this.onTextureRemoved = () => {
      this.handleTextureRemoved();
    };
    this.textureManager?.on('textureRemoved', this.onTextureRemoved);
  }

  /**
   * Called when geometry is created for a tile.
   * Creates terrain object and adds it to the scene.
   */
  handleGeometryAdded(
    data: TerrainGeometryObjectManagerEvents['geometryAdded']
  ): void {
    const { key, geometry } = data;
    const textureObject =
      this.textureManager?.getTerrainTextureObject(key) ?? null;

    const terrainObject = this.factory.createTerrainObject(
      geometry,
      textureObject
    );
    this.objects.set(key, terrainObject);
    this.scene.add(terrainObject.getMesh());
  }

  /**
   * Called when geometry is removed for a tile.
   * Removes terrain object from scene and cleans up.
   */
  handleGeometryRemoved(
    data: TerrainGeometryObjectManagerEvents['geometryRemoved']
  ): void {
    const { key } = data;
    const terrainObject = this.objects.get(key);
    if (terrainObject) {
      this.scene.remove(terrainObject.getMesh());
      terrainObject.dispose();
      this.objects.delete(key);
    }
  }

  /**
   * Called when a texture is added for a tile (texture upgrade).
   * If a terrain object exists, recreates it with the new texture.
   */
  handleTextureAdded(
    data: TerrainTextureObjectManagerEvents['textureAdded']
  ): void {
    const { key, texture } = data;
    if (!this.objects.has(key)) return;

    const geometryObject = this.geometryManager.getTerrainGeometryObject(key);
    const terrainObject = this.objects.get(key);
    if (!geometryObject || !terrainObject) return;

    if (!texture) return;

    // Swap mesh in scene
    this.scene.remove(terrainObject.getMesh());
    terrainObject.dispose();

    const newTerrainObject = this.factory.createTerrainObject(
      geometryObject,
      texture
    );
    this.objects.set(key, newTerrainObject);
    this.scene.add(newTerrainObject.getMesh());
  }

  /**
   * Called when a texture is removed for a tile.
   * Texture state is managed implicitly through TerrainObject lifecycle.
   */
  handleTextureRemoved(): void {
    // No-op
  }

  /**
   * Get a terrain object by its tile key
   */
  getTerrainObject(tileKey: TileKey): TerrainObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Clean up all objects, remove from scene, and clear the collection.
   * Also disposes owned dependency managers (geometry and texture).
   */
  dispose(): void {
    if (this.onGeometryAdded) {
      this.geometryManager.off('geometryAdded', this.onGeometryAdded);
    }
    if (this.onGeometryRemoved) {
      this.geometryManager.off('geometryRemoved', this.onGeometryRemoved);
    }
    if (this.onTextureAdded && this.textureManager) {
      this.textureManager.off('textureAdded', this.onTextureAdded);
    }
    if (this.onTextureRemoved && this.textureManager) {
      this.textureManager.off('textureRemoved', this.onTextureRemoved);
    }

    // Remove all meshes from scene and dispose TerrainObjects (mesh + material)
    for (const terrainObject of this.objects.values()) {
      this.scene.remove(terrainObject.getMesh());
      terrainObject.dispose();
    }
    this.objects.clear();

    // Dispose delegated managers (composed dependencies)
    this.geometryManager.dispose();
    this.textureManager?.dispose();
  }
}
