import type { WaterVisual } from './types';
import type { CanvasDrawContext } from '../types';
import { drawPolygon, drawLineString } from '../canvasHelpers';

export function drawWater(
  features: WaterVisual[],
  draw: CanvasDrawContext
): void {
  const { ctx, bounds, scaleX, scaleY } = draw;

  // Pass 1: Water bodies (polygon areas, not wetlands)
  for (const water of features) {
    if (!water.isArea || water.type === 'wetland') continue;
    if (water.geometry.type !== 'Polygon') continue;
    ctx.fillStyle = water.color;
    drawPolygon(ctx, water.geometry, bounds, scaleX, scaleY);
  }

  // Pass 2: Wetlands
  for (const water of features) {
    if (water.type !== 'wetland') continue;
    if (water.geometry.type !== 'Polygon') continue;
    ctx.fillStyle = water.color;
    drawPolygon(ctx, water.geometry, bounds, scaleX, scaleY);
  }

  // Pass 3: Waterway lines
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const water of features) {
    if (water.isArea) continue;
    if (water.geometry.type !== 'LineString') continue;
    ctx.setLineDash(water.intermittent ? [4, 4] : []);
    ctx.strokeStyle = water.color;
    ctx.lineWidth = water.widthMeters * draw.pixelsPerMeter;
    drawLineString(ctx, water.geometry, bounds, scaleX, scaleY);
  }
}
