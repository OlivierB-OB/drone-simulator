import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawLanduse } from './canvas';
import type { ModuleFeatures } from './types';

export const landuseModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 65,
  canvasOrder: 10,

  moduleFeaturesFactory(): ModuleFeatures {
    return { landuse: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawLanduse(features.landuse, draw);
  },
};
