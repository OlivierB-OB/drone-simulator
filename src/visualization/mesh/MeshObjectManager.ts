import type { Object3D } from 'three';
import { Scene } from '../../3Dviewer/Scene';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { ContextDataTile } from '../../data/contextual/types';
import type { ElevationDataManager } from '../../data/elevation/ElevationDataManager';
import type { ElevationSampler } from './util/ElevationSampler';
import { BuildingMeshFactory } from './building/BuildingMeshFactory';
import { VegetationMeshFactory } from './vegetation/VegetationMeshFactory';
import { StructureMeshFactory } from './structure/StructureMeshFactory';
import { BarrierMeshFactory } from './barrier/BarrierMeshFactory';
import { BridgeMeshFactory } from './bridge/BridgeMeshFactory';
import { TileObjectManager } from '../TileObjectManager';

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
  private readonly buildingFactory: BuildingMeshFactory;
  private readonly vegetationFactory: VegetationMeshFactory;
  private readonly structureFactory: StructureMeshFactory;
  private readonly barrierFactory: BarrierMeshFactory;
  private readonly bridgeFactory: BridgeMeshFactory;

  constructor(
    private readonly scene: Scene,
    contextData: ContextDataManager,
    elevationSampler: ElevationSampler,
    elevationData: ElevationDataManager
  ) {
    super(contextData, [elevationData]);
    this.buildingFactory = new BuildingMeshFactory(elevationSampler);
    this.vegetationFactory = new VegetationMeshFactory(elevationSampler);
    this.structureFactory = new StructureMeshFactory(elevationSampler);
    this.barrierFactory = new BarrierMeshFactory(elevationSampler);
    this.bridgeFactory = new BridgeMeshFactory(elevationSampler);
  }

  protected override createObject(
    _key: string,
    tile: ContextDataTile
  ): Object3D[] {
    const { features } = tile;
    const meshes: Object3D[] = [];

    meshes.push(...this.buildingFactory.create(features.buildings));
    meshes.push(...this.vegetationFactory.create(features.vegetation));
    meshes.push(...this.structureFactory.create(features.structures));
    meshes.push(...this.barrierFactory.create(features.barriers));
    meshes.push(...this.bridgeFactory.createFromRoads(features.roads));
    meshes.push(...this.bridgeFactory.createFromRailways(features.railways));

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
