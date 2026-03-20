import type { Object3D } from 'three';
import type { GeoBounds } from '../gis/GeoCoordinates';
import type { GeoCoordinates } from '../gis/GeoCoordinates';
import type { ElevationSampler } from '../visualization/mesh/util/ElevationSampler';
import type { ModulesFeatures } from './registrationTypes';

export interface CanvasDrawContext {
  ctx: CanvasRenderingContext2D;
  bounds: GeoBounds;
  scaleX: number; // pixels per degree longitude
  scaleY: number; // pixels per degree latitude
  pixelsPerMeter: number; // for line width conversion (meters -> pixels)
}

export interface FeatureModule<T> {
  readonly classifyPriority: number;
  readonly canvasOrder?: number;

  moduleFeaturesFactory(): T;

  postProcess?(features: ModulesFeatures): void;

  drawCanvas?(features: ModulesFeatures, draw: CanvasDrawContext): void;

  createMeshes?(
    features: ModulesFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[];
}
