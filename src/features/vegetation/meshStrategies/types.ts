import type { VegetationVisual } from '../types';

export interface TreePoint {
  lng: number;
  lat: number;
  trunkHeightMin: number;
  trunkHeightMax: number;
  crownRadiusMin: number;
  crownRadiusMax: number;
  isNeedle: boolean;
  colors: string[];
}

export interface BushPoint {
  lng: number;
  lat: number;
  radiusMin: number;
  radiusMax: number;
  colors: string[];
}

export interface IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    trees: TreePoint[],
    bushes: BushPoint[]
  ): void;
}
