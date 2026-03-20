import type { CanvasDrawContext } from '../types';
import { drawPolygon, drawLineString } from '../canvasHelpers';
import type { AerowayVisual } from './types';

export function drawAeroways(
  features: AerowayVisual[],
  draw: CanvasDrawContext
): void {
  const { ctx, bounds, scaleX, scaleY } = draw;

  ctx.setLineDash([]);
  for (const aeroway of features) {
    ctx.fillStyle = aeroway.color;
    ctx.strokeStyle = aeroway.color;

    if (aeroway.geometry.type === 'Polygon') {
      drawPolygon(ctx, aeroway.geometry, bounds, scaleX, scaleY);
    } else if (aeroway.geometry.type === 'LineString') {
      ctx.lineWidth = (aeroway.widthMeters ?? 45) * draw.pixelsPerMeter;
      drawLineString(ctx, aeroway.geometry, bounds, scaleX, scaleY);
    } else if (aeroway.geometry.type === 'Point') {
      const [lng, lat] = aeroway.geometry.coordinates as [number, number];
      const canvasX = (lng - bounds.minLng) * scaleX;
      const canvasY = (bounds.maxLat - lat) * scaleY;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
