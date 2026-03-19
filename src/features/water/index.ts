import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawWater } from './canvas';
import type { ModuleFeatures } from './types';

export const waterModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 40,
  canvasOrder: 20,

  moduleFeaturesFactory(): ModuleFeatures {
    return { waters: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawWater(features.waters, draw);
  },
};
