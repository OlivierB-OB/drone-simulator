import type { Object3D } from 'three';
import { Scene } from '../../3Dviewer/Scene';
import type { ContextDataManager } from '../../data/contextual/ContextDataManager';
import type { ContextDataTile } from '../../data/contextual/types';
import type { ElevationSampler } from './util/ElevationSampler';
import { BuildingMeshFactory } from './building/BuildingMeshFactory';
import { VegetationMeshFactory } from './vegetation/VegetationMeshFactory';
import { StructureMeshFactory } from './structure/StructureMeshFactory';
import { BarrierMeshFactory } from './barrier/BarrierMeshFactory';
import { BridgeMeshFactory } from './bridge/BridgeMeshFactory';

/**
 * Manages 3D mesh objects (buildings, vegetation, structures, barriers, bridges)
 * in response to context data tile lifecycle events.
 *
 * Follows the same event-driven pattern as TerrainTextureObjectManager:
 * listens to tileAdded/tileRemoved, delegates to per-feature-type factories.
 */
export class MeshObjectManager {
  private readonly objects = new Map<string, Object3D[]>();
  private readonly buildingFactory: BuildingMeshFactory;
  private readonly vegetationFactory: VegetationMeshFactory;
  private readonly structureFactory: StructureMeshFactory;
  private readonly barrierFactory: BarrierMeshFactory;
  private readonly bridgeFactory: BridgeMeshFactory;

  private onTileAdded = ({
    key,
    tile,
  }: {
    key: string;
    tile: ContextDataTile;
  }) => {
    this.createMeshes(key, tile);
  };

  private onTileRemoved = ({ key }: { key: string }) => {
    this.removeMeshes(key);
  };

  constructor(
    private readonly scene: Scene,
    private readonly contextData: ContextDataManager,
    elevationSampler: ElevationSampler
  ) {
    this.buildingFactory = new BuildingMeshFactory(elevationSampler);
    this.vegetationFactory = new VegetationMeshFactory(elevationSampler);
    this.structureFactory = new StructureMeshFactory(elevationSampler);
    this.barrierFactory = new BarrierMeshFactory(elevationSampler);
    this.bridgeFactory = new BridgeMeshFactory(elevationSampler);

    this.contextData.on('tileAdded', this.onTileAdded);
    this.contextData.on('tileRemoved', this.onTileRemoved);
  }

  private createMeshes(key: string, tile: ContextDataTile): void {
    const meshes: Object3D[] = [];
    const { features } = tile;

    // Collect building parent IDs that have child parts (skip parent outlines)
    const parentsWithParts = new Set<string>();
    // Note: building:part relations would need parent tracking in the parser;
    // for now we render all buildings including parts independently.

    meshes.push(
      ...this.buildingFactory.create(features.buildings, parentsWithParts)
    );
    meshes.push(...this.vegetationFactory.create(features.vegetation));
    meshes.push(...this.structureFactory.create(features.structures));
    meshes.push(...this.barrierFactory.create(features.barriers));
    meshes.push(...this.bridgeFactory.createFromRoads(features.roads));
    meshes.push(...this.bridgeFactory.createFromRailways(features.railways));

    for (const mesh of meshes) {
      this.scene.add(mesh);
    }
    this.objects.set(key, meshes);
  }

  private removeMeshes(key: string): void {
    const meshes = this.objects.get(key);
    if (!meshes) return;

    for (const mesh of meshes) {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        const m = child as unknown as {
          geometry?: { dispose: () => void };
          material?: { dispose: () => void } | Array<{ dispose: () => void }>;
        };
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      });
    }
    this.objects.delete(key);
  }

  dispose(): void {
    this.contextData.off('tileAdded', this.onTileAdded);
    this.contextData.off('tileRemoved', this.onTileRemoved);

    for (const key of this.objects.keys()) {
      this.removeMeshes(key);
    }
    this.objects.clear();
  }
}
