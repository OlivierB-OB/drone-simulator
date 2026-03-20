import type { Object3D } from 'three';
import type { VegetationVisual } from '../types';
import type { GeoCoordinates } from '../../../gis/GeoCoordinates';

export interface IVegetationStrategy {
  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[];
}
