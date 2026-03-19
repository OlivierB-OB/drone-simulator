import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawAeroways } from './canvas';
import type { ModuleFeatures } from './types';

export const aerowayModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 50,
  canvasOrder: 60,

  moduleFeaturesFactory(): ModuleFeatures {
    return { airports: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawAeroways(features.airports, draw);
  },
};
