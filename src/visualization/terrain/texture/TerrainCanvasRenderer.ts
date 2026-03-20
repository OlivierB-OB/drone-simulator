import type { ContextDataTile } from '../../../data/contextual/types';
import type { GeoBounds } from '../../../data/elevation/types';
import { EARTH_RADIUS } from '../../../gis/GeoCoordinates';
import { groundColors } from '../../../config';
import { featureRegistry } from '../../../features/registry';
import '../../../features/registration';

const TO_RAD = Math.PI / 180;

/**
 * Renders context features (landuse, roads, water, vegetation, etc.) onto a canvas.
 * The canvas serves as a texture that will be applied to terrain meshes.
 *
 * Draw order (painter's algorithm, back to front):
 *   1. Base ground fill
 *   2. Landuse/landcover areas
 *   3. Water bodies (polygon areas)
 *   4. Wetlands
 *   5. Waterway lines
 *   6. Vegetation areas
 *   7. Aeroways
 *   8. Roads (sorted by widthMeters ascending)
 *   9. Railways
 */
export class TerrainCanvasRenderer {
  /**
   * Render a context tile's features onto a canvas.
   *
   * @param canvas - HTMLCanvasElement to render onto
   * @param contextTile - Context data tile containing features
   * @param geoBounds - Geographic coordinate bounds for the tile
   */
  renderTile(
    canvas: HTMLCanvasElement,
    contextTile: ContextDataTile,
    geoBounds: GeoBounds
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    this.clear(canvas);

    const lngRange = geoBounds.maxLng - geoBounds.minLng;
    const latRange = geoBounds.maxLat - geoBounds.minLat;
    const scaleX = width / lngRange; // pixels per degree longitude
    const scaleY = height / latRange; // pixels per degree latitude

    // For line width conversion (meters -> pixels)
    const centerLat = (geoBounds.minLat + geoBounds.maxLat) / 2;
    const metersPerDegreeLng =
      TO_RAD * EARTH_RADIUS * Math.cos(centerLat * TO_RAD);
    const pixelsPerMeter = scaleX / metersPerDegreeLng;

    featureRegistry.drawAllCanvas(contextTile.features, {
      ctx,
      bounds: geoBounds,
      scaleX,
      scaleY,
      pixelsPerMeter,
    });
  }

  /**
   * Clear the canvas with the default ground color.
   */
  clear(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = groundColors.default;
    ctx.fillRect(0, 0, width, height);
  }
}
