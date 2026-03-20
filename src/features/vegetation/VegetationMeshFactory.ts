import type { Object3D } from 'three';
import type { VegetationVisual } from './types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './meshStrategies/types';
import { ForestStrategy } from './meshStrategies/ForestStrategy';
import { ScrubStrategy } from './meshStrategies/ScrubStrategy';
import { OrchardStrategy } from './meshStrategies/OrchardStrategy';
import { VineyardStrategy } from './meshStrategies/VineyardStrategy';
import { SingleTreeStrategy } from './meshStrategies/SingleTreeStrategy';
import { TreeRowStrategy } from './meshStrategies/TreeRowStrategy';

/**
 * Creates 3D vegetation meshes using InstancedMesh for performance.
 * Handles forests, scrub, orchards, vineyards, single trees, and tree rows.
 */
export class VegetationMeshFactory {
  private readonly strategies: Map<string, IVegetationStrategy>;

  constructor(elevation: ElevationSampler) {
    const forest = new ForestStrategy(elevation);
    const scrub = new ScrubStrategy(elevation);
    this.strategies = new Map<string, IVegetationStrategy>([
      ['forest', forest],
      ['wood', forest],
      ['scrub', scrub],
      ['heath', scrub],
      ['orchard', new OrchardStrategy(elevation)],
      ['vineyard', new VineyardStrategy(elevation)],
      ['tree', new SingleTreeStrategy(elevation)],
      ['tree_row', new TreeRowStrategy(elevation)],
    ]);
  }

  create(vegetation: VegetationVisual[], origin: GeoCoordinates): Object3D[] {
    const meshes: Object3D[] = [];
    for (const veg of vegetation) {
      try {
        meshes.push(
          ...(this.strategies.get(veg.type)?.create(veg, origin) ?? [])
        );
      } catch {
        // Skip problematic vegetation features
      }
    }
    return meshes;
  }
}
