import { Scene } from '../../3Dviewer/Scene';
import { TerrainObject } from './TerrainObject';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import type { TerrainTextureObjectManager } from './texture/TerrainTextureObjectManager';
import type { TileKey } from './geometry/types';
import type { ElevationDataTile } from '../../data/elevation/types';
import type { ContextDataTile } from '../../data/contextual/types';

/**
 * Manages a collection of TerrainObject instances in the 3D scene.
 * Reacts to data tile events to create, remove, and upgrade terrain objects.
 */
export class TerrainObjectManager {
  private readonly objects: Map<TileKey, TerrainObject>;
  private readonly scene: Scene;
  private readonly geometryManager: TerrainGeometryObjectManager;
  private readonly textureManager: TerrainTextureObjectManager | undefined;
  private readonly factory: TerrainObjectFactory;
  private readonly textureStateMap: Map<TileKey, boolean>;

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
    this.textureStateMap = new Map();
  }

  /**
   * Called when an elevation tile finishes loading.
   * Creates geometry, optionally creates texture, and adds terrain object to scene.
   */
  handleElevationTileAdded(
    key: TileKey,
    elevationTile: ElevationDataTile,
    contextTile: ContextDataTile | null
  ): void {
    const geometryObject = this.geometryManager.createGeometry(
      key,
      elevationTile
    );

    const textureObject =
      this.textureManager?.createTexture(key, contextTile) ?? null;

    const terrainObject = this.factory.createTerrainObject(
      geometryObject,
      textureObject
    );
    this.objects.set(key, terrainObject);
    this.scene.add(terrainObject.getMesh());
    this.textureStateMap.set(key, textureObject !== null);
  }

  /**
   * Called when an elevation tile is unloaded.
   * Removes terrain object from scene and disposes all associated resources.
   */
  handleElevationTileRemoved(key: TileKey): void {
    const terrainObject = this.objects.get(key);
    if (terrainObject) {
      this.scene.remove(terrainObject.getMesh());
      terrainObject.dispose();
      this.objects.delete(key);
    }
    this.geometryManager.removeGeometry(key);
    this.textureManager?.removeTexture(key);
    this.textureStateMap.delete(key);
  }

  /**
   * Called when a context tile finishes loading (texture upgrade).
   * If a terrain object exists without texture, recreates it with the new texture.
   */
  handleContextTileAdded(key: TileKey, contextTile: ContextDataTile): void {
    const hadTexture = this.textureStateMap.get(key) ?? false;
    if (hadTexture || !this.objects.has(key)) return;

    const geometryObject = this.geometryManager.getTerrainGeometryObject(key);
    const terrainObject = this.objects.get(key);
    if (!geometryObject || !terrainObject) return;

    // Remove old texture entry and create new one with actual context data
    this.textureManager?.removeTexture(key);
    const textureObject =
      this.textureManager?.createTexture(key, contextTile) ?? null;
    if (!textureObject) return;

    // Swap mesh in scene
    this.scene.remove(terrainObject.getMesh());
    terrainObject.dispose();

    const newTerrainObject = this.factory.createTerrainObject(
      geometryObject,
      textureObject
    );
    this.objects.set(key, newTerrainObject);
    this.scene.add(newTerrainObject.getMesh());
    this.textureStateMap.set(key, true);
  }

  /**
   * Get a terrain object by its tile key
   */
  getTerrainObject(tileKey: TileKey): TerrainObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed terrain objects
   */
  getAllObjects(): TerrainObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all objects, remove from scene, and clear the collection
   */
  dispose(): void {
    for (const terrainObject of this.objects.values()) {
      this.scene.remove(terrainObject.getMesh());
      terrainObject.dispose();
    }
    this.objects.clear();
    this.textureStateMap.clear();
  }
}
