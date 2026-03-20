import type { RailwayVisual } from './types';
import type { CanvasDrawContext } from '../types';
import { drawLineString } from '../canvasHelpers';

export function drawRailways(
  features: RailwayVisual[],
  draw: CanvasDrawContext
): void {
  const { ctx, bounds, scaleX, scaleY } = draw;

  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  for (const railway of features) {
    ctx.strokeStyle = railway.color;
    ctx.lineWidth = railway.widthMeters * draw.pixelsPerMeter;
    ctx.setLineDash(railway.dash);
    drawLineString(ctx, railway.geometry, bounds, scaleX, scaleY);
  }

  ctx.setLineDash([]);
}
