import type { Object3D } from 'three';
import centroid from '@turf/centroid';
import type { StructureVisual } from './types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import { geoToLocal, type GeoCoordinates } from '../../gis/GeoCoordinates';
import { structureDefaults } from '../../config';
import type { IStructureStrategy } from './meshStrategies/types';
import { CylinderStrategy } from './meshStrategies/CylinderStrategy';
import { TaperedCylinderStrategy } from './meshStrategies/TaperedCylinderStrategy';
import { BoxStrategy } from './meshStrategies/BoxStrategy';
import { WaterTowerStrategy } from './meshStrategies/WaterTowerStrategy';
import { CraneStrategy } from './meshStrategies/CraneStrategy';

/**
 * Creates 3D meshes for man-made structures (towers, chimneys, masts, etc.)
 * using parametric shapes from config defaults.
 *
 * Coordinates are [lng, lat] in degrees (GeoJSON convention).
 */
const cylinderStrategy = new CylinderStrategy();

export class StructureMeshFactory {
  private readonly strategies = new Map<string, IStructureStrategy>([
    ['cylinder', cylinderStrategy],
    ['tapered_cylinder', new TaperedCylinderStrategy()],
    ['box', new BoxStrategy()],
    ['water_tower', new WaterTowerStrategy()],
    ['crane', new CraneStrategy()],
  ]);

  constructor(private readonly elevation: ElevationSampler) {}

  create(structures: StructureVisual[], origin: GeoCoordinates): Object3D[] {
    const meshes: Object3D[] = [];
    for (const structure of structures) {
      const mesh = this.createStructureMesh(structure, origin);
      if (mesh) meshes.push(mesh);
    }
    return meshes;
  }

  private createStructureMesh(
    structure: StructureVisual,
    origin: GeoCoordinates
  ): Object3D | null {
    const defaults = structureDefaults[structure.type];
    if (!defaults) return null;

    const height = structure.height ?? defaults.height;
    const radius = structure.diameter
      ? structure.diameter / 2
      : defaults.radius;
    const color = structure.color;

    // getPosition returns [lng, lat]
    const [lng, lat] = this.getPosition(structure);
    const terrainY = this.elevation.sampleAt(lat, lng);

    const strategy = this.strategies.get(defaults.shape) ?? cylinderStrategy;
    const obj = strategy.create({ radius, height, color });
    const pos = geoToLocal(lat, lng, terrainY + height / 2, origin);
    obj.position.set(pos.x, pos.y, pos.z);
    return obj;
  }

  private getPosition(structure: StructureVisual): [number, number] {
    if (structure.geometry.type === 'Point') {
      return structure.geometry.coordinates as [number, number];
    }
    return centroid(structure.geometry).geometry.coordinates as [
      number,
      number,
    ];
  }
}
