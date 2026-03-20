import type { RoadVisual } from './types';
import type { CanvasDrawContext } from '../types';
import { drawLineString } from '../canvasHelpers';

export function drawRoads(
  features: RoadVisual[],
  draw: CanvasDrawContext
): void {
  const { ctx, bounds, scaleX, scaleY } = draw;

  const sorted = [...features].sort((a, b) => a.widthMeters - b.widthMeters);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const road of sorted) {
    ctx.setLineDash(road.type === 'steps' ? [2, 2] : []);
    ctx.strokeStyle = road.surfaceColor ?? road.color;
    ctx.lineWidth = road.widthMeters * scaleX;
    drawLineString(ctx, road.geometry, bounds, scaleX, scaleY);
  }
  ctx.setLineDash([]);
}
