import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawRoads } from './canvas';
import type { ModuleFeatures } from './types';

export const roadModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 20,
  canvasOrder: 70,

  moduleFeaturesFactory(): ModuleFeatures {
    return { roads: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawRoads(features.roads, draw);
  },
};
