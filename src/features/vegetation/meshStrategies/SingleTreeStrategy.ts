import {
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  MeshLambertMaterial,
  Mesh,
  Group,
  type Object3D,
} from 'three';
import type { VegetationVisual } from '../types';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import { geoToLocal, type GeoCoordinates } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './types';
import {
  TRUNK_COLOR,
  BROADLEAF_COLORS,
  NEEDLELEAF_COLORS,
} from './vegetationUtils';

export class SingleTreeStrategy implements IVegetationStrategy {
  constructor(private readonly elevation: ElevationSampler) {}

  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[] {
    if (veg.geometry.type !== 'Point') return [];
    // GeoJSON: [lng, lat]
    const [lng, lat] = veg.geometry.coordinates as [number, number];
    const terrainY = this.elevation.sampleAt(lat, lng);

    const isNeedle = veg.leafType === 'needleleaved';
    const treeHeight = veg.height ?? 10;
    const crownRadius = veg.crownDiameter
      ? veg.crownDiameter / 2
      : treeHeight * 0.25;
    const trunkHeight = treeHeight * 0.4;
    const trunkRadius = veg.trunkCircumference
      ? veg.trunkCircumference / (2 * Math.PI)
      : crownRadius * 0.15;

    const group = new Group();

    const trunkGeom = new CylinderGeometry(
      trunkRadius,
      trunkRadius * 1.2,
      trunkHeight,
      6
    );
    const trunkMat = new MeshLambertMaterial({ color: TRUNK_COLOR });
    const trunk = new Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkHeight / 2;
    group.add(trunk);

    const canopyColor = isNeedle ? NEEDLELEAF_COLORS[0]! : BROADLEAF_COLORS[0]!;
    const canopyGeom = isNeedle
      ? new ConeGeometry(crownRadius, treeHeight - trunkHeight, 8)
      : new SphereGeometry(crownRadius, 8, 6);
    const canopyMat = new MeshLambertMaterial({ color: canopyColor });
    const canopy = new Mesh(canopyGeom, canopyMat);
    canopy.position.y =
      trunkHeight + (isNeedle ? (treeHeight - trunkHeight) / 2 : crownRadius);
    group.add(canopy);

    const pos = geoToLocal(lat, lng, terrainY, origin);
    group.position.set(pos.x, pos.y, pos.z);
    return [group];
  }
}
