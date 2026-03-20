import type { LineString, Polygon } from 'geojson';
import type { GeoBounds } from '../gis/GeoCoordinates';

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  geometry: Polygon,
  bounds: GeoBounds,
  scaleX: number,
  scaleY: number
): void {
  const rings = geometry.coordinates as [number, number][][];

  ctx.beginPath();
  for (const ring of rings) {
    let first = true;
    for (const [lng, lat] of ring) {
      const canvasX = (lng - bounds.minLng) * scaleX;
      const canvasY = (bounds.maxLat - lat) * scaleY;
      if (first) {
        ctx.moveTo(canvasX, canvasY);
        first = false;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    ctx.closePath();
  }

  ctx.fill('evenodd');
}

export function drawLineString(
  ctx: CanvasRenderingContext2D,
  geometry: LineString,
  bounds: GeoBounds,
  scaleX: number,
  scaleY: number
): void {
  const coordinates = geometry.coordinates as [number, number][];

  ctx.beginPath();
  let firstPoint = true;

  for (const [lng, lat] of coordinates) {
    const canvasX = (lng - bounds.minLng) * scaleX;
    const canvasY = (bounds.maxLat - lat) * scaleY;

    if (firstPoint) {
      ctx.moveTo(canvasX, canvasY);
      firstPoint = false;
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }

  ctx.stroke();
}
