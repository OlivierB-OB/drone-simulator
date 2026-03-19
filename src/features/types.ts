import type { Object3D } from 'three';
import type { MercatorBounds } from '../gis/types';
import type { ElevationSampler } from '../visualization/mesh/util/ElevationSampler';
import type { ModulesFeatures } from './registrationTypes';

export interface CanvasDrawContext {
  ctx: CanvasRenderingContext2D;
  bounds: MercatorBounds;
  scaleX: number;
  scaleY: number;
}

export interface FeatureModule<T> {
  readonly classifyPriority: number;
  readonly canvasOrder?: number;

  moduleFeaturesFactory(): T;

  postProcess?(features: ModulesFeatures): void;

  drawCanvas?(features: ModulesFeatures, draw: CanvasDrawContext): void;

  createMeshes?(
    features: ModulesFeatures,
    elevationSampler: ElevationSampler
  ): Object3D[];
}
