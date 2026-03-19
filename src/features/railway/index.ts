import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawRailways } from './canvas';
import type { ModuleFeatures } from './types';

export const railwayModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 30,
  canvasOrder: 80,

  moduleFeaturesFactory(): ModuleFeatures {
    return { railways: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawRailways(features.railways, draw);
  },
};
