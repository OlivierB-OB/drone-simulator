import type { Object3D } from 'three';
import type { VegetationVisual } from './types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import type {
  IVegetationStrategy,
  TreePoint,
  BushPoint,
} from './meshStrategies/types';
import { ForestStrategy } from './meshStrategies/ForestStrategy';
import { ScrubStrategy } from './meshStrategies/ScrubStrategy';
import { OrchardStrategy } from './meshStrategies/OrchardStrategy';
import { VineyardStrategy } from './meshStrategies/VineyardStrategy';
import { SingleTreeStrategy } from './meshStrategies/SingleTreeStrategy';
import { TreeRowStrategy } from './meshStrategies/TreeRowStrategy';
import {
  batchInstancedTrees,
  batchInstancedBushes,
} from './meshStrategies/vegetationUtils';

/**
 * Creates 3D vegetation meshes using a unified two-pass batch approach.
 * Pass 1: collect all tree/bush points from strategies.
 * Pass 2: batch into a single set of InstancedMeshes (2–4 draw calls per tile).
 */
export class VegetationMeshFactory {
  private readonly strategies: Map<string, IVegetationStrategy>;

  constructor(private readonly elevation: ElevationSampler) {
    const forest = new ForestStrategy();
    const scrub = new ScrubStrategy();
    this.strategies = new Map<string, IVegetationStrategy>([
      ['forest', forest],
      ['wood', forest],
      ['scrub', scrub],
      ['heath', scrub],
      ['orchard', new OrchardStrategy()],
      ['vineyard', new VineyardStrategy()],
      ['tree', new SingleTreeStrategy()],
      ['tree_row', new TreeRowStrategy()],
    ]);
  }

  create(vegetation: VegetationVisual[], origin: GeoCoordinates): Object3D[] {
    const treePoints: TreePoint[] = [];
    const bushPoints: BushPoint[] = [];

    for (const veg of vegetation) {
      try {
        this.strategies
          .get(veg.type)
          ?.collectPoints(veg, treePoints, bushPoints);
      } catch {
        // Skip problematic vegetation features
      }
    }

    return [
      ...batchInstancedTrees(treePoints, this.elevation, origin),
      ...batchInstancedBushes(bushPoints, this.elevation, origin),
    ];
  }
}
