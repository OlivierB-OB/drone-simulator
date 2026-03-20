import type { Object3D } from 'three';
import { Scene } from '../../3Dviewer/Scene';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { ContextDataTile } from '../../data/contextual/types';
import type { ElevationDataManager } from '../../data/elevation/ElevationDataManager';
import type { ElevationSampler } from './util/ElevationSampler';
import { featureRegistry } from '../../features/registry';
import '../../features/registration';
import { TileObjectManager } from '../TileObjectManager';
import type { OriginManager } from '../../gis/OriginManager';

/**
 * Manages 3D mesh objects (buildings, vegetation, structures, barriers, bridges)
 * in response to context data tile lifecycle events.
 *
 * Follows the same event-driven pattern as TerrainTextureObjectManager:
 * listens to tileAdded/tileRemoved, delegates to per-feature-type factories.
 */
export class MeshObjectManager extends TileObjectManager<
  ContextDataTile,
  Object3D[]
> {
  constructor(
    private readonly scene: Scene,
    contextData: ContextDataManager,
    private readonly elevationSampler: ElevationSampler,
    elevationData: ElevationDataManager,
    private readonly originManager: OriginManager
  ) {
    super(contextData, [elevationData]);
  }

  protected override createObject(
    _key: string,
    tile: ContextDataTile
  ): Object3D[] {
    const meshes = featureRegistry.createAllMeshes(
      tile.features,
      this.elevationSampler,
      this.originManager.getOrigin()
    );

    for (const mesh of meshes) {
      this.scene.add(mesh);
    }
    return meshes;
  }

  protected override disposeObject(meshes: Object3D[]): void {
    for (const mesh of meshes) {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        const m = child as unknown as {
          geometry?: { dispose: () => void };
          material?: { dispose: () => void } | { dispose: () => void }[];
        };
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      });
    }
  }
}
